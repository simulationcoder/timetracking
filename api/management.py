from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func

from db import get_session
from models import User, Team, TeamMembership, Role
from services import (
    ensure_role,
    assign_roles,
    serialize_user,
    serialize_team,
    ensure_user_in_team,
    set_user_panels,
    AVAILABLE_PANELS,
)
from security import require_panel, require_any_panel


router = APIRouter(prefix="/management", tags=["management"])


class RoleCreate(BaseModel):
    name: str


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role_names: List[str] = []


class UserRolesUpdate(BaseModel):
    role_names: List[str]


class TeamCreate(BaseModel):
    name: str
    leader_id: int
    member_ids: List[int] = []


class TeamUpdate(BaseModel):
    name: str | None = None
    leader_id: int | None = None


class TeamMemberPayload(BaseModel):
    user_id: int

class PanelUpdate(BaseModel):
    panels: List[str]


@router.post("/roles", status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    db: Session = Depends(get_session),
    _: User = Depends(require_panel("permissions")),
):
    normalized = payload.name.strip().lower()
    if not normalized:
        raise HTTPException(status_code=400, detail="Role name is required.")
    existing = db.query(Role).filter(func.lower(Role.name) == normalized).first()
    if existing:
        return {"id": existing.id, "name": existing.name}
    role = ensure_role(db, normalized)
    return {"id": role.id, "name": role.name}


@router.get("/roles")
def list_roles(
    db: Session = Depends(get_session),
    _: User = Depends(require_panel("permissions")),
):
    roles = db.query(Role).order_by(Role.name.asc()).all()
    return [{"id": r.id, "name": r.name} for r in roles]


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_session),
    _: User = Depends(require_panel("permissions")),
):
    email_lower = payload.email.lower()
    existing = db.query(User).filter(func.lower(User.email) == email_lower).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with that email already exists.")
    user = User(name=payload.name, email=email_lower)
    db.add(user)
    db.commit()
    db.refresh(user)
    ensure_role(db, "employee")
    assign_roles(db, user, ["employee"], replace=False)
    if payload.role_names:
        assign_roles(db, user, payload.role_names, replace=False)
    db.refresh(user)
    return serialize_user(user)


@router.get("/users")
def list_users(
    db: Session = Depends(get_session),
    _: User = Depends(require_any_panel("manage-data", "permissions")),
):
    users = db.query(User).order_by(User.name.asc()).all()
    return [serialize_user(u) for u in users]


@router.put("/users/{user_id}/roles")
def update_user_roles(
    user_id: int,
    payload: UserRolesUpdate,
    db: Session = Depends(get_session),
    _: User = Depends(require_panel("permissions")),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    assign_roles(db, user, payload.role_names, replace=True)
    ensure_role(db, "employee")
    assign_roles(db, user, ["employee"], replace=False)
    db.refresh(user)
    return serialize_user(user)


@router.post("/teams", status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_session),
    _: User = Depends(require_panel("manage-data")),
):
    leader = db.get(User, payload.leader_id)
    if not leader:
        raise HTTPException(status_code=404, detail="Leader not found.")
    existing = db.query(Team).filter(func.lower(Team.name) == payload.name.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team with that name already exists.")

    team = Team(name=payload.name.strip(), leader_id=leader.id)
    db.add(team)
    db.commit()
    db.refresh(team)

    # Team leader is an approver
    ensure_role(db, "approver")
    assign_roles(db, leader, ["approver"], replace=False)
    ensure_user_in_team(db, team, leader)

    member_ids = {mid for mid in payload.member_ids if mid != leader.id}
    for member_id in member_ids:
        member = db.get(User, member_id)
        if not member:
            continue
        ensure_user_in_team(db, team, member)

    db.refresh(team)
    return serialize_team(team)


@router.get("/teams")
def list_teams(
    db: Session = Depends(get_session),
    _: User = Depends(require_panel("manage-data")),
):
    teams = db.query(Team).order_by(Team.name.asc()).all()
    return [serialize_team(t) for t in teams]


@router.put("/teams/{team_id}")
def update_team(
    team_id: int,
    payload: TeamUpdate,
    db: Session = Depends(get_session),
    _: User = Depends(require_panel("manage-data")),
):
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    if payload.name is not None:
        team.name = payload.name.strip()

    if payload.leader_id is not None and payload.leader_id != team.leader_id:
        new_leader = db.get(User, payload.leader_id)
        if not new_leader:
            raise HTTPException(status_code=404, detail="Leader not found.")
        team.leader_id = new_leader.id
        ensure_role(db, "approver")
        assign_roles(db, new_leader, ["approver"], replace=False)
        ensure_user_in_team(db, team, new_leader)

    db.add(team)
    db.commit()
    db.refresh(team)
    return serialize_team(team)


@router.post("/teams/{team_id}/members", status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: int,
    payload: TeamMemberPayload,
    db: Session = Depends(get_session),
    _: User = Depends(require_panel("manage-data")),
):
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    member = db.get(User, payload.user_id)
    if not member:
        raise HTTPException(status_code=404, detail="User not found.")
    ensure_user_in_team(db, team, member)
    db.refresh(team)
    return serialize_team(team)


@router.delete("/teams/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_session),
    _: User = Depends(require_panel("manage-data")),
):
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if team.leader_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot remove the team leader from the team.")
    membership = db.query(TeamMembership).filter(
        TeamMembership.team_id == team_id,
        TeamMembership.user_id == user_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found.")
    db.delete(membership)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/panels")
def list_panels(_: User = Depends(require_panel("permissions"))):
    return {"panels": sorted(AVAILABLE_PANELS)}


@router.put("/users/{user_id}/panels")
def update_user_panels(
    user_id: int,
    payload: PanelUpdate,
    db: Session = Depends(get_session),
    _: User = Depends(require_panel("permissions")),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    set_user_panels(db, user, payload.panels, replace=True)
    db.refresh(user)
    return serialize_user(user)

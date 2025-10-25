from typing import Iterable

from sqlalchemy.orm import Session
from sqlalchemy import func

from models import User, Role, UserRole, Team, TeamMembership, UserPanel

AVAILABLE_PANELS = {"timesheets", "manage-data", "submitted", "permissions"}


def ensure_role(db: Session, role_name: str) -> Role:
    """Fetch or create a role."""
    normalized = role_name.strip().lower()
    role = db.query(Role).filter(func.lower(Role.name) == normalized).first()
    if role:
        return role
    role = Role(name=normalized)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def assign_roles(db: Session, user: User, role_names: Iterable[str], replace: bool = False) -> None:
    """Assign roles to a user. When replace is True, remove roles not in role_names."""
    normalized = {r.strip().lower() for r in role_names if r and r.strip()}
    if not normalized and not replace:
        return

    existing = {ur.role.name: ur for ur in user.user_roles}

    if replace:
        to_remove = [ur for name, ur in existing.items() if name not in normalized]
        for ur in to_remove:
            db.delete(ur)

    for name in normalized:
        if name in existing:
            continue
        role = ensure_role(db, name)
        db.add(UserRole(user_id=user.id, role_id=role.id))

    db.commit()
    db.refresh(user)


def serialize_user(user: User) -> dict:
    """Return a JSON-serialisable representation of a user."""
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "roles": sorted({ur.role.name for ur in user.user_roles}),
        "panels": sorted({panel.panel for panel in user.panels}),
    }


def serialize_team(team: Team) -> dict:
    """Serialize a team with leader and members."""
    leader = team.leader
    member_entries = [
        serialize_user(m.member)
        for m in sorted(
            (mem for mem in team.members if mem.member),
            key=lambda mem: mem.member.name.lower(),
        )
    ]
    return {
        "id": team.id,
        "name": team.name,
        "leader": serialize_user(leader) if leader else None,
        "members": member_entries,
        "created_at": team.created_at.isoformat(),
    }


def ensure_user_in_team(db: Session, team: Team, user: User) -> None:
    """Add user to team membership if not already present."""
    existing = db.query(TeamMembership).filter(
        TeamMembership.team_id == team.id,
        TeamMembership.user_id == user.id,
    ).first()
    if existing:
        return
    db.add(TeamMembership(team_id=team.id, user_id=user.id))
    db.commit()
    db.refresh(team)


def set_user_panels(db: Session, user: User, panels: Iterable[str], replace: bool = True) -> None:
    normalized = {p.strip() for p in panels if p and p.strip()}
    normalized = {p for p in normalized if p in AVAILABLE_PANELS}

    existing = {panel.panel: panel for panel in user.panels}

    if replace:
        for panel_name, panel_obj in list(existing.items()):
            if panel_name not in normalized:
                db.delete(panel_obj)

    for panel_name in normalized:
        if panel_name in existing:
            continue
        db.add(UserPanel(user_id=user.id, panel=panel_name))

    db.commit()
    db.refresh(user)

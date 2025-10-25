import os
from datetime import date, datetime
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, text
from sqlalchemy.orm import Session, sessionmaker

from dotenv import load_dotenv
load_dotenv()

from models import Base, User, Project, Activity, Timesheet, TimeEntry, Approval, Role, Team, UserRole
from db import get_engine, get_session
from tasks import export_timesheets_task_entrypoint
from services import ensure_role, assign_roles, set_user_panels, AVAILABLE_PANELS
from management import router as management_router
from auth import router as auth_router
from security import require_panel, require_any_panel, get_current_active_user, hash_password

app = FastAPI(title="Timesheet API", version="0.1.0")
app.include_router(auth_router)
app.include_router(management_router)

# ---------------- Pydantic Schemas ----------------
class ProjectIn(BaseModel):
    name: str
    client: Optional[str] = None
    is_billable: bool = True
    team_id: Optional[int] = None

class ActivityIn(BaseModel):
    code: str
    description: Optional[str] = None
    project_id: int

class TimesheetIn(BaseModel):
    week_start: date

class TimeEntryIn(BaseModel):
    timesheet_id: int
    project_id: int
    activity_id: int
    date: date
    hours: float
    notes: Optional[str] = None
    billable: bool = True

class ApprovalDecisionIn(BaseModel):
    decision: str  # approve | reject
    comment: Optional[str] = None

class ApproverIn(BaseModel):
    name: str
    email: EmailStr

# ---------------- Routes ----------------
@app.get("/health")
def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}


@app.on_event("startup")
def startup():
    engine = get_engine()
    # Ensure TimescaleDB extension, then create tables, then hypertable
    with engine.begin() as conn:
        conn.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS timescaledb;")
    Base.metadata.create_all(bind=engine)  # auto-create tables for MVP
    # Ensure projects.team_id and activities.project_id columns exist
    def exec_sql(statement: str) -> None:
        with engine.connect() as conn:
            try:
                conn.execute(text(statement))
                conn.commit()
            except Exception:
                conn.rollback()

    exec_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)")
    exec_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE")
    exec_sql("ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id INTEGER")
    exec_sql("CREATE INDEX IF NOT EXISTS ix_projects_team_id ON projects(team_id)")
    exec_sql("ALTER TABLE activities ADD COLUMN IF NOT EXISTS project_id INTEGER")
    exec_sql("CREATE INDEX IF NOT EXISTS ix_activities_project_id ON activities(project_id)")
    try:
        exec_sql(
            "ALTER TABLE projects ADD CONSTRAINT fk_projects_team FOREIGN KEY (team_id) REFERENCES teams(id)"
        )
    except Exception:
        pass
    try:
        exec_sql(
            "ALTER TABLE activities ADD CONSTRAINT fk_activities_project FOREIGN KEY (project_id) REFERENCES projects(id)"
        )
    except Exception:
        pass
    # Convert time_entries into hypertable on 'date'
    try:
        with engine.begin() as conn:
            conn.exec_driver_sql("""
                SELECT create_hypertable('time_entries','date', if_not_exists => TRUE);
            """)
    except Exception as e:
        # Ignore if already hypertable or extension not available
        pass
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
    with SessionLocal() as db:
        ensure_role(db, "employee")
        ensure_role(db, "approver")
        ensure_role(db, "admin")
        bootstrap_admin_user(db)


# Projects
@app.post("/projects")
def create_project(
    payload: ProjectIn,
    db: Session = Depends(get_session),
    _: User = Depends(require_panel("manage-data")),
):
    team = None
    if payload.team_id:
        team = db.get(Team, payload.team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found.")
    p = Project(name=payload.name, client=payload.client, is_billable=payload.is_billable, team_id=team.id if team else None)
    db.add(p)
    db.commit()
    db.refresh(p)
    return {
        "id": p.id,
        "name": p.name,
        "client": p.client,
        "is_billable": p.is_billable,
        "team": {"id": team.id, "name": team.name} if team else None,
    }

@app.get("/projects")
def list_projects(
    db: Session = Depends(get_session),
    _: User = Depends(require_any_panel("timesheets", "manage-data", "submitted", "permissions")),
):
    items = db.query(Project).order_by(Project.id.desc()).all()
    return [{
        "id":i.id,
        "name":i.name,
        "client":i.client,
        "is_billable":i.is_billable,
        "team": {"id": i.team.id, "name": i.team.name} if i.team else None,
    } for i in items]

# Activities
@app.post("/activities")
def create_activity(payload: ActivityIn, db: Session = Depends(get_session), _: User = Depends(require_panel("manage-data"))):
    project = db.get(Project, payload.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    a = Activity(code=payload.code, description=payload.description, project_id=project.id)
    db.add(a)
    db.commit()
    db.refresh(a)
    return {
        "id": a.id,
        "code": a.code,
        "description": a.description,
        "project_id": project.id,
        "project": {"id": project.id, "name": project.name},
    }

@app.get("/activities")
def list_activities(db: Session = Depends(get_session), _: User = Depends(require_any_panel("timesheets", "manage-data", "submitted", "permissions"))):
    items = db.query(Activity).order_by(Activity.code.asc()).all()
    return [{
        "id":i.id,
        "code":i.code,
        "description":i.description,
        "project_id": i.project_id,
        "project": {"id": i.project.id, "name": i.project.name} if i.project else None,
    } for i in items]

# Timesheets
@app.post("/timesheets")
def create_timesheet(
    payload: TimesheetIn,
    db: Session = Depends(get_session),
    user: User = Depends(require_panel("timesheets")),
):
    existing = (
        db.query(Timesheet)
        .filter(Timesheet.user_id == user.id, Timesheet.week_start == payload.week_start)
        .first()
    )
    if existing:
        return {
            "id": existing.id,
            "user_id": user.id,
            "week_start": str(existing.week_start),
            "status": existing.status,
        }
    timesheet = Timesheet(user_id=user.id, week_start=payload.week_start, status="draft")
    db.add(timesheet)
    db.commit()
    db.refresh(timesheet)
    return {
        "id": timesheet.id,
        "user_id": user.id,
        "week_start": str(timesheet.week_start),
        "status": timesheet.status,
    }


@app.get("/timesheets")
def list_timesheets(
    db: Session = Depends(get_session),
    user: User = Depends(require_panel("timesheets")),
):
    rows = (
        db.query(Timesheet)
        .filter(Timesheet.user_id == user.id)
        .order_by(Timesheet.week_start.desc())
        .all()
    )
    return [
        {"id": r.id, "week_start": str(r.week_start), "status": r.status}
        for r in rows
    ]


@app.post("/timesheets/{tid}/submit")
def submit_timesheet(
    tid: int,
    db: Session = Depends(get_session),
    user: User = Depends(require_panel("timesheets")),
):
    timesheet = db.get(Timesheet, tid)
    if not timesheet or timesheet.user_id != user.id:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    if timesheet.status not in ("draft", "rejected"):
        raise HTTPException(status_code=400, detail="Timesheet already submitted or approved")

    approver = (
        db.query(User)
        .join(UserRole, User.id == UserRole.user_id)
        .join(Role, UserRole.role_id == Role.id)
        .filter(func.lower(Role.name) == "approver")
        .order_by(User.id.asc())
        .first()
    )
    if not approver:
        raise HTTPException(status_code=400, detail="No approver configured")

    timesheet.status = "submitted"
    db.add(timesheet)

    approval = (
        db.query(Approval)
        .filter(Approval.timesheet_id == timesheet.id, Approval.approver_id == approver.id)
        .first()
    )
    if approval:
        approval.decision = None
        approval.comment = None
        approval.decided_at = None
    else:
        approval = Approval(timesheet_id=timesheet.id, approver_id=approver.id)
    db.add(approval)
    db.commit()
    return {"timesheet_id": timesheet.id, "status": timesheet.status}


# Time Entries
@app.post("/time-entries")
def create_time_entry(
    payload: TimeEntryIn,
    db: Session = Depends(get_session),
    user: User = Depends(require_panel("timesheets")),
):
    timesheet = db.get(Timesheet, payload.timesheet_id)
    if not timesheet or timesheet.user_id != user.id:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    if timesheet.status != "draft":
        raise HTTPException(status_code=400, detail="Timesheet is locked (not draft)")

    project = db.get(Project, payload.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    activity = db.get(Activity, payload.activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if activity.project_id != project.id:
        raise HTTPException(status_code=400, detail="Activity does not belong to the selected project")

    entry = TimeEntry(
        timesheet_id=timesheet.id,
        project_id=payload.project_id,
        activity_id=payload.activity_id,
        date=payload.date,
        hours=payload.hours,
        notes=payload.notes,
        billable=payload.billable,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": entry.id}


@app.get("/time-entries")
def list_time_entries(
    tid: int,
    db: Session = Depends(get_session),
    user: User = Depends(require_panel("timesheets")),
):
    timesheet = db.get(Timesheet, tid)
    if not timesheet or timesheet.user_id != user.id:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    rows = (
        db.query(TimeEntry)
        .filter(TimeEntry.timesheet_id == tid)
        .order_by(TimeEntry.date.asc())
        .all()
    )
    return [
        {
            "id": r.id,
            "date": str(r.date),
            "hours": r.hours,
            "notes": r.notes,
            "project_id": r.project_id,
            "activity_id": r.activity_id,
            "billable": r.billable,
        }
        for r in rows
    ]
# Approvals
@app.post("/approvals/{tid}")
def approve_timesheet(
    tid: int,
    payload: ApprovalDecisionIn,
    db: Session = Depends(get_session),
    user: User = Depends(require_panel("submitted")),
):
    timesheet = db.get(Timesheet, tid)
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    approval = (
        db.query(Approval)
        .filter(Approval.timesheet_id == tid, Approval.approver_id == user.id)
        .first()
    )
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    if payload.decision not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="decision must be approve|reject")

    approval.decision = payload.decision
    approval.comment = payload.comment
    approval.decided_at = datetime.utcnow()
    db.add(approval)

    timesheet.status = "approved" if payload.decision == "approve" else "rejected"
    db.add(timesheet)
    db.commit()
    return {"timesheet_id": timesheet.id, "status": timesheet.status}

# Approvers management
@app.get("/approvers")
def list_approvers(db: Session = Depends(get_session), _: User = Depends(require_any_panel("manage-data", "permissions"))):
    rows = (
        db.query(User)
        .join(UserRole, User.id == UserRole.user_id)
        .join(Role, UserRole.role_id == Role.id)
        .filter(func.lower(Role.name) == "approver")
        .order_by(User.name.asc())
        .all()
    )
    return [{
        "id":r.id,
        "name":r.name,
        "email":r.email,
        "roles": sorted({ur.role.name for ur in r.user_roles}),
    } for r in rows]

@app.post("/approvers")
def create_approver(payload: ApproverIn, db: Session = Depends(get_session), _: User = Depends(require_panel("manage-data"))):
    payload_email = payload.email.strip().lower()
    existing = db.query(User).filter(func.lower(User.email)==payload_email).first()
    if existing:
        existing.name = payload.name
        existing.role = "manager"
        db.add(existing)
        db.commit()
        db.refresh(existing)
        assign_roles(db, existing, ["approver", "manager"], replace=False)
        set_user_panels(db, existing, ["submitted"], replace=False)
        db.refresh(existing)
        return {
            "id": existing.id,
            "name": existing.name,
            "email": existing.email,
            "roles": sorted({ur.role.name for ur in existing.user_roles}),
        }
    u = User(name=payload.name, email=payload_email, role="manager")
    db.add(u)
    db.commit()
    db.refresh(u)
    assign_roles(db, u, ["employee", "approver", "manager"], replace=False)
    set_user_panels(db, u, ["submitted"], replace=False)
    db.refresh(u)
    return {"id": u.id, "name": u.name, "email": u.email, "roles": sorted({ur.role.name for ur in u.user_roles})}

@app.get("/approvers/{approver_id}/timesheets")
def list_submitted_timesheets(approver_id: int, db: Session = Depends(get_session), user: User = Depends(require_any_panel("submitted", "permissions"))):
    panel_names = {p.panel for p in user.panels}
    if user.role != "admin" and "permissions" not in panel_names and approver_id != user.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    approver = db.get(User, approver_id)
    if not approver:
        raise HTTPException(status_code=404, detail="Approver not found")

    hours_subq = (
        db.query(
            TimeEntry.timesheet_id.label("tid"),
            func.coalesce(func.sum(TimeEntry.hours), 0).label("total_hours")
        )
        .group_by(TimeEntry.timesheet_id)
        .subquery()
    )

    rows = (
        db.query(
            Timesheet,
            Approval,
            User,
            func.coalesce(hours_subq.c.total_hours, 0).label("total_hours")
        )
        .join(Approval, Approval.timesheet_id == Timesheet.id)
        .join(User, Timesheet.user_id == User.id)
        .outerjoin(hours_subq, hours_subq.c.tid == Timesheet.id)
        .filter(
            Approval.approver_id == approver_id,
            Timesheet.status.in_(("submitted", "approved", "rejected"))
        )
        .order_by(Timesheet.week_start.desc())
        .all()
    )

    return [{
        "id": t.id,
        "week_start": str(t.week_start),
        "status": t.status,
        "employee": {"id": owner.id, "name": owner.name},
        "total_hours": float(total_hours or 0),
        "approval": {
            "id": approval.id,
            "decision": approval.decision,
            "decided_at": approval.decided_at.isoformat() if approval.decided_at else None,
            "comment": approval.comment,
        }
    } for t, approval, owner, total_hours in rows]

# CSV export for payroll/ERP
@app.post("/exports/week/{week_start}")
def export_week(week_start: date):
    # returns a task id for Celery; for MVP, run synchronously
    path = export_timesheets_task_entrypoint(str(week_start))
    return {"export_path": path, "tip": "Mounts at ./exports in the API container"}
def bootstrap_admin_user(db: Session) -> None:
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_name = os.getenv("ADMIN_NAME", "Administrator")
    if not admin_email or not admin_password:
        return

    email_lower = admin_email.lower()
    admin = db.query(User).filter(func.lower(User.email) == email_lower).first()
    password_hash = hash_password(admin_password)

    if not admin:
        admin = User(
            name=admin_name,
            email=email_lower,
            password_hash=password_hash,
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    else:
        updated = False
        if not admin.password_hash:
            admin.password_hash = password_hash
            updated = True
        if admin.role != "admin":
            admin.role = "admin"
            updated = True
        if not admin.is_active:
            admin.is_active = True
            updated = True
        if updated:
            db.add(admin)
            db.commit()
            db.refresh(admin)

    ensure_role(db, "admin")
    ensure_role(db, "employee")
    assign_roles(db, admin, ["admin", "employee"], replace=True)
    set_user_panels(db, admin, AVAILABLE_PANELS, replace=True)

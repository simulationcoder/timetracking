import os, csv, io
from datetime import date, datetime, timedelta
from celery import Celery
from sqlalchemy import select, and_
from sqlalchemy.orm import Session

from db import get_engine, get_session
from models import TimeEntry, Timesheet, Project, Activity, User

BROKER_URL = os.getenv("REDIS_URL","redis://redis:6379/0")
celery_app = Celery(__name__, broker=BROKER_URL, backend=BROKER_URL)

EXPORT_DIR = "/app/exports"
os.makedirs(EXPORT_DIR, exist_ok=True)

@celery_app.task
def export_timesheets(week_start: str) -> str:
    return _export_impl(week_start)

def export_timesheets_task_entrypoint(week_start: str) -> str:
    # Simple sync wrapper for MVP
    return _export_impl(week_start)

def _export_impl(week_start: str) -> str:
    ws = date.fromisoformat(week_start)
    we = ws + timedelta(days=6)
    engine = get_engine()
    with Session(engine) as db:
        q = db.query(TimeEntry, Timesheet, Project, Activity).join(Timesheet, TimeEntry.timesheet_id==Timesheet.id)\
            .join(Project, TimeEntry.project_id==Project.id)\
            .join(Activity, TimeEntry.activity_id==Activity.id)\
            .filter(TimeEntry.date>=ws, TimeEntry.date<=we, Timesheet.status=="approved")
        rows = q.all()
        fname = f"timesheet_export_{ws.isoformat()}.csv"
        fpath = os.path.join(EXPORT_DIR, fname)
        with open(fpath, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["timesheet_id","date","user_id","project","activity","hours","billable","notes"])
            for e, t, p, a in rows:
                w.writerow([t.id, e.date.isoformat(), t.user_id, p.name, a.code, e.hours, e.billable, (e.notes or "")])
    return fpath

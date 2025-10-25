"""Seed initial data for the timesheet platform."""

from sqlalchemy.orm import Session

from db import get_engine
from models import (
    Activity,
    Base,
    Project,
    Team,
    Timesheet,
    TimeEntry,
    User,
)
from security import hash_password
from services import (
    AVAILABLE_PANELS,
    assign_roles,
    ensure_role,
    ensure_user_in_team,
    set_user_panels,
)


def upsert_user(db: Session, *, name: str, email: str, password: str, roles: list[str], panels: list[str]):
    email_lower = email.lower()
    user = db.query(User).filter(User.email == email_lower).first()
    password_hash = hash_password(password)

    if user is None:
        user = User(
            name=name,
            email=email_lower,
            password_hash=password_hash,
            role=roles[0] if roles else 'employee',
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        updated = False
        if user.name != name:
            user.name = name
            updated = True
        if password_hash and user.password_hash != password_hash:
            user.password_hash = password_hash
            updated = True
        if not user.is_active:
            user.is_active = True
            updated = True
        if roles and user.role != roles[0]:
            user.role = roles[0]
            updated = True
        if updated:
            db.add(user)
            db.commit()
            db.refresh(user)

    ensure_role(db, 'employee')
    for role in roles:
        ensure_role(db, role)
    assign_roles(db, user, roles or ['employee'], replace=True)
    set_user_panels(db, user, panels, replace=True)
    db.refresh(user)
    return user


def main():
    engine = get_engine()
    Base.metadata.create_all(bind=engine)

    with Session(engine) as db:
        ensure_role(db, 'employee')
        ensure_role(db, 'manager')
        ensure_role(db, 'approver')
        ensure_role(db, 'admin')

        admin = upsert_user(
            db,
            name='Admin User',
            email='admin@example.com',
            password='Admin123!',
            roles=['admin', 'employee'],
            panels=list(AVAILABLE_PANELS),
        )

        manager = upsert_user(
            db,
            name='Maya Manager',
            email='maya.manager@example.com',
            password='Manager123!',
            roles=['manager', 'approver', 'employee'],
            panels=['timesheets', 'manage-data', 'submitted'],
        )

        employee = upsert_user(
            db,
            name='Eli Employee',
            email='eli.employee@example.com',
            password='Employee123!',
            roles=['employee'],
            panels=['timesheets'],
        )

        team = db.query(Team).filter(Team.name == 'Delivery Team').first()
        if team is None:
            team = Team(name='Delivery Team', leader_id=manager.id)
            db.add(team)
            db.commit()
            db.refresh(team)
        else:
            if team.leader_id != manager.id:
                team.leader_id = manager.id
                db.add(team)
                db.commit()

        ensure_user_in_team(db, team, manager)
        ensure_user_in_team(db, team, employee)

        project_data = [
            ('Acme Redesign', 'Acme Corp', True),
            ('Internal R&D', None, False),
        ]
        projects = {}
        for name, client, is_billable in project_data:
            project = db.query(Project).filter(Project.name == name).first()
            if project is None:
                project = Project(name=name, client=client, is_billable=is_billable, team_id=team.id)
                db.add(project)
                db.commit()
                db.refresh(project)
            else:
                project.client = client
                project.is_billable = is_billable
                project.team_id = team.id
                db.add(project)
                db.commit()
            projects[name] = project

        activity_data = [
            ('DEV', 'Feature Development', 'Acme Redesign'),
            ('PM', 'Project Management', 'Acme Redesign'),
            ('RND', 'Research & Prototyping', 'Internal R&D'),
        ]
        for code, description, project_name in activity_data:
            project = projects[project_name]
            activity = db.query(Activity).filter(Activity.code == code).first()
            if activity is None:
                activity = Activity(code=code, description=description, project_id=project.id)
                db.add(activity)
            else:
                activity.description = description
                activity.project_id = project.id
                db.add(activity)
        db.commit()

        print('Seed data applied successfully.')


if __name__ == '__main__':
    main()

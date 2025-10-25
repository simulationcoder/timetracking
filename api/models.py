from datetime import datetime, date
from sqlalchemy.orm import declarative_base, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, Date, Float, ForeignKey, DateTime, Text, UniqueConstraint

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(200), unique=True)
    role: Mapped[str] = mapped_column(String(50), default="employee")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    user_roles: Mapped[list["UserRole"]] = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    led_teams: Mapped[list["Team"]] = relationship("Team", back_populates="leader", cascade="all, delete", foreign_keys="Team.leader_id")
    team_memberships: Mapped[list["TeamMembership"]] = relationship("TeamMembership", back_populates="member", cascade="all, delete-orphan")
    panels: Mapped[list["UserPanel"]] = relationship("UserPanel", back_populates="user", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120))
    client: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_billable: Mapped[bool] = mapped_column(Boolean, default=True)
    team_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    activities: Mapped[list["Activity"]] = relationship("Activity", back_populates="project", cascade="all, delete-orphan")
    team: Mapped["Team"] = relationship("Team", back_populates="projects")

class Activity(Base):
    __tablename__ = "activities"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(30), unique=True)
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    project_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    project: Mapped["Project"] = relationship("Project", back_populates="activities")

class Timesheet(Base):
    __tablename__ = "timesheets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    week_start: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft|submitted|approved|rejected

class TimeEntry(Base):
    __tablename__ = "time_entries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timesheet_id: Mapped[int] = mapped_column(Integer, ForeignKey("timesheets.id", ondelete="CASCADE"))
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id"))
    activity_id: Mapped[int] = mapped_column(Integer, ForeignKey("activities.id"))
    date: Mapped[date] = mapped_column(Date, index=True)
    hours: Mapped[float] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    billable: Mapped[bool] = mapped_column(Boolean, default=True)

class Approval(Base):
    __tablename__ = "approvals"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timesheet_id: Mapped[int] = mapped_column(Integer, ForeignKey("timesheets.id", ondelete="CASCADE"))
    approver_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    decision: Mapped[str | None] = mapped_column(String(20), nullable=True)  # approve|reject
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

class Team(Base):
    __tablename__ = "teams"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    leader_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    leader: Mapped[User] = relationship("User", back_populates="led_teams")
    members: Mapped[list["TeamMembership"]] = relationship("TeamMembership", back_populates="team", cascade="all, delete-orphan")
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="team")

class TeamMembership(Base):
    __tablename__ = "team_memberships"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    team_id: Mapped[int] = mapped_column(Integer, ForeignKey("teams.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    team: Mapped[Team] = relationship("Team", back_populates="members")
    member: Mapped[User] = relationship("User", back_populates="team_memberships")

    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_member"),
    )

class Role(Base):
    __tablename__ = "roles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(60), unique=True)

    user_roles: Mapped[list["UserRole"]] = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")

class UserRole(Base):
    __tablename__ = "user_roles"
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship("User", back_populates="user_roles")
    role: Mapped[Role] = relationship("Role", back_populates="user_roles")

class UserPanel(Base):
    __tablename__ = "user_panels"
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    panel: Mapped[str] = mapped_column(String(50), primary_key=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship("User", back_populates="panels")

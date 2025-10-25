from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func

from db import get_session
from models import User
from security import (
    hash_password,
    verify_password,
    create_access_token,
    set_access_cookie,
    clear_access_cookie,
    get_current_active_user,
)
from services import (
    ensure_role,
    assign_roles,
    serialize_user,
    set_user_panels,
    AVAILABLE_PANELS,
)


router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterPayload(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


def _create_session(response: Response, user: User) -> dict:
    token = create_access_token(str(user.id), expires_delta=timedelta(minutes=60))
    set_access_cookie(response, token)
    return {"user": serialize_user(user)}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterPayload, response: Response, db: Session = Depends(get_session)):
    email_lower = payload.email.lower()
    existing = db.query(User).filter(func.lower(User.email) == email_lower).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with that email already exists.")

    user = User(
        name=payload.name.strip(),
        email=email_lower,
        password_hash=hash_password(payload.password),
        role="employee",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    ensure_role(db, "employee")
    assign_roles(db, user, ["employee"], replace=True)

    total_users = db.query(User).count()
    if total_users == 1:
        user.role = "admin"
        db.add(user)
        db.commit()
        db.refresh(user)
        assign_roles(db, user, ["admin", "employee"], replace=True)
        set_user_panels(db, user, AVAILABLE_PANELS, replace=True)
    else:
        default_panels = ["timesheets"]
        set_user_panels(db, user, default_panels, replace=True)

    db.refresh(user)
    return _create_session(response, user)


@router.post("/login")
def login_user(payload: LoginPayload, response: Response, db: Session = Depends(get_session)):
    email_lower = payload.email.lower()
    user = db.query(User).filter(func.lower(User.email) == email_lower).first()
    if not user or not verify_password(payload.password, user.password_hash or ""):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")

    return _create_session(response, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_user(response: Response):
    clear_access_cookie(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me")
def get_me(user: User = Depends(get_current_active_user)):
    return serialize_user(user)

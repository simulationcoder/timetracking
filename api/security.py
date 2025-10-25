import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, Request, Response, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from db import get_session
from models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
SESSION_COOKIE_NAME = "session"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {"sub": subject, "exp": expire, "iat": datetime.utcnow()}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def set_access_cookie(response: Response, token: str) -> None:
    max_age = JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        max_age=max_age,
        httponly=True,
        samesite="lax",
    )


def clear_access_cookie(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE_NAME)


def _get_token_from_request(request: Request) -> str:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return token


def get_current_user(request: Request, db: Session = Depends(get_session)) -> User:
    token = _get_token_from_request(request)
    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication payload")

    user = db.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


def require_panel(panel: str, *, allow_admin: bool = True):
    def dependency(user: User = Depends(get_current_active_user)) -> User:
        if allow_admin and user.role == "admin":
            return user
        panel_names = {p.panel for p in user.panels}
        if panel not in panel_names:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency


def require_any_panel(*panels: str, allow_admin: bool = True):
    panels = tuple(panels)

    def dependency(user: User = Depends(get_current_active_user)) -> User:
        if allow_admin and user.role == "admin":
            return user
        panel_names = {p.panel for p in user.panels}
        if not any(panel in panel_names for panel in panels):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency


def require_employee_panel(panel: str):
    def dependency(user: User = Depends(get_current_active_user)) -> User:
        if user.role == "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrators cannot perform this action")
        panel_names = {p.panel for p in user.panels}
        if panel not in panel_names:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency


def require_employee_any_panel(*panels: str):
    panels = tuple(panels)

    def dependency(user: User = Depends(get_current_active_user)) -> User:
        if user.role == "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrators cannot perform this action")
        panel_names = {p.panel for p in user.panels}
        if not any(panel in panel_names for panel in panels):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return dependency


def require_active_admin(user: User = Depends(get_current_active_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return user

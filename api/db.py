import os
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

def _dsn():
    user = os.getenv("POSTGRES_USER","app")
    pwd = os.getenv("POSTGRES_PASSWORD","app")
    db = os.getenv("POSTGRES_DB","timesheets")
    host = os.getenv("POSTGRES_HOST","db")
    port = os.getenv("POSTGRES_PORT","5432")
    return f"postgresql+psycopg://{user}:{pwd}@{host}:{port}/{db}"

_engine = None
_Session = None

def get_engine():
    global _engine, _Session
    if _engine is None:
        _engine = create_engine(_dsn(), pool_pre_ping=True)
        _Session = sessionmaker(bind=_engine, expire_on_commit=False)
    return _engine

def get_session() -> Generator[Session, None, None]:
    if _Session is None:
        get_engine()
    session = _Session()
    try:
        yield session
    finally:
        session.close()

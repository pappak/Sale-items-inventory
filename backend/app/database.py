import os
import ssl
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

_engine = None
_SessionLocal = None


def _build_url(raw: str) -> str:
    """Rewrite URL scheme for pg8000 and strip sslmode (handled via connect_args)."""
    raw = raw.replace("postgresql://", "postgresql+pg8000://", 1)
    raw = raw.replace("postgres://", "postgresql+pg8000://", 1)
    parsed = urlparse(raw)
    # Remove sslmode — pg8000 uses ssl_context in connect_args instead
    params = {k: v[0] for k, v in parse_qs(parsed.query).items() if k != "sslmode"}
    return urlunparse(parsed._replace(query=urlencode(params)))


def get_engine():
    global _engine
    if _engine is None:
        raw_url = os.environ.get("DBB7196801_DATABASE_URL") or os.environ.get("DBB7196801_DIRECT_URL")
        if not raw_url:
            raise RuntimeError("DBB7196801_DATABASE_URL environment variable is not set")

        url = _build_url(raw_url)
        ssl_ctx = ssl.create_default_context()

        _engine = create_engine(
            url,
            connect_args={"timeout": 10, "ssl_context": ssl_ctx},
            pool_pre_ping=True,
            pool_timeout=15,
        )
    return _engine


def get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal


engine = None  # populated lazily via get_engine()


def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

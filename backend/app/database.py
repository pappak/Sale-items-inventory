import os
import ssl
from urllib.parse import urlparse, parse_qs

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        # Prefer the project-specific connector prefix, then fall back to any match
        raw_url = (
            os.environ.get("DBFA8B5DAA_DIRECT_URL")
            or os.environ.get("DBFA8B5DAA_DATABASE_URL")
        )
        if not raw_url:
            # Fallback: search for any connector (handles fresh projects with different prefix)
            for key, val in os.environ.items():
                if key.endswith("_DIRECT_URL") and val:
                    raw_url = val
                    break
        if not raw_url:
            for key, val in os.environ.items():
                if key.endswith("_DATABASE_URL") and val:
                    raw_url = val
                    break
        if not raw_url:
            raise RuntimeError(
                "No database environment variable found. "
                "Set up a Neon Postgres connector or provide *_DATABASE_URL."
            )

        # Normalise to postgresql:// for urlparse
        url = raw_url
        for prefix in ("postgresql+pg8000://", "postgres://"):
            if url.startswith(prefix):
                url = "postgresql://" + url[len(prefix):]
                break

        parsed = urlparse(url)
        host     = parsed.hostname
        port     = parsed.port or 5432
        database = parsed.path.lstrip("/").split("?")[0]
        user     = parsed.username
        password = parsed.password

        ssl_ctx = ssl.create_default_context()

        import pg8000.dbapi

        def creator():
            """Directly call pg8000 — bypasses SQLAlchemy's channel_binding injection."""
            return pg8000.dbapi.connect(
                host=host,
                port=port,
                database=database,
                user=user,
                password=password,
                ssl_context=ssl_ctx,
                timeout=10,
            )

        _engine = create_engine(
            "postgresql+pg8000://",
            creator=creator,
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

import os
import ssl

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

# Deferred so the engine is only created when first needed, not at import time
_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        url = os.environ.get("DBB7196801_DATABASE_URL") or os.environ.get("DBB7196801_DIRECT_URL")
        if not url:
            raise RuntimeError("DBB7196801_DATABASE_URL environment variable is not set")

        # Rewrite scheme so SQLAlchemy uses pg8000 (pure Python, no C deps)
        url = url.replace("postgresql://", "postgresql+pg8000://", 1)
        url = url.replace("postgres://", "postgresql+pg8000://", 1)

        # pg8000 requires SSL via connect_args, not URL params
        ssl_context = ssl.create_default_context()

        _engine = create_engine(
            url,
            connect_args={"timeout": 10, "ssl_context": ssl_context},
            pool_pre_ping=True,
            pool_timeout=15,
        )
    return _engine


def get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal


# Convenience alias used by models/routers
engine = None  # populated lazily via get_engine()


def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

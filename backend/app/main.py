import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.routers import items, photos, ai, share, export, auth

# Resolve absolute paths relative to this file so they work regardless of cwd
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")


def init_db():
    try:
        from backend.app.database import get_engine, Base
        from backend.app.models import models  # noqa: ensure models are registered
        engine = get_engine()
        Base.metadata.create_all(bind=engine)
        # Add bytea columns if upgrading from filesystem-based storage
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE item_photos "
                "ADD COLUMN IF NOT EXISTS data BYTEA, "
                "ADD COLUMN IF NOT EXISTS mime_type TEXT NOT NULL DEFAULT 'application/octet-stream'"
            ))
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"DB init skipped: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Inventory Listing Generator", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API routers
    app.include_router(items.router, prefix="/api")
    app.include_router(photos.router, prefix="/api")
    app.include_router(photos.make_photo_router(), prefix="/api")
    app.include_router(ai.router, prefix="/api")
    app.include_router(share.router, prefix="/api")
    app.include_router(export.router, prefix="/api")
    app.include_router(auth.router, prefix="/api")
    app.include_router(share.public_router)

    @app.get("/api/health")
    def health():
        import os
        from sqlalchemy import text
        status = {"status": "ok", "db": None, "error": None}
        try:
            from backend.app.database import get_engine
            with get_engine().connect() as conn:
                conn.execute(text("SELECT 1"))
            status["db"] = "connected"
        except Exception as e:
            status["db"] = "failed"
            status["error"] = str(e)
            status["status"] = "degraded"
        return status

    # React frontend — only mount if dist exists (skipped during dev if not built yet)
    if os.path.isdir(FRONTEND_DIST):
        app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

    return app


app = create_app()

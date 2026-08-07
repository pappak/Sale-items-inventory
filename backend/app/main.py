import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.routers import items, photos, ai, share, export, auth

# Resolve absolute paths relative to this file so they work regardless of cwd
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")


def init_db():
    try:
        from backend.app.database import get_engine, Base
        from backend.app.models import models  # noqa: ensure models are registered
        Base.metadata.create_all(bind=get_engine())
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

    # Uploads — serve via explicit route so it isn't caught by SPA fallback in deployment
    os.makedirs(UPLOADS_DIR, exist_ok=True)

    from fastapi.responses import FileResponse

    @app.get("/uploads/{filename}")
    async def serve_upload(filename: str):
        file_path = os.path.join(UPLOADS_DIR, filename)
        if not os.path.isfile(file_path):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(file_path)

    # React frontend — only mount if dist exists (skipped during dev if not built yet)
    if os.path.isdir(FRONTEND_DIST):
        app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

    return app


app = create_app()

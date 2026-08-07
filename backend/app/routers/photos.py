import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import Item, ItemPhoto
from backend.app.routers.auth import require_admin

router = APIRouter(prefix="/items", tags=["photos"])

MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB cap

INLINE_SAFE_MIME = {
    "image/png", "image/jpeg", "image/jpg", "image/gif",
    "image/webp", "image/avif", "image/heic", "image/heif",
}


class PhotoOut(BaseModel):
    id: str
    item_id: str
    filename: str
    url: str
    sort_order: int

    class Config:
        from_attributes = True


@router.post("/{item_id}/photos", response_model=List[PhotoOut], status_code=201)
def upload_photos(
    item_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Determine starting sort_order
    existing_count = db.query(ItemPhoto).filter(ItemPhoto.item_id == item_id).count()

    created = []
    for idx, file in enumerate(files):
        contents = file.file.read(MAX_UPLOAD_BYTES + 1)
        if not contents:
            raise HTTPException(400, "Empty file")
        if len(contents) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, f"File too large (max {MAX_UPLOAD_BYTES // 1024 // 1024} MB)")

        safe_name = (file.filename or "unnamed").replace("/", "_").replace("..", "")
        unique_name = f"{uuid.uuid4()}_{safe_name}"
        mime = (file.content_type or "application/octet-stream").lower()

        photo = ItemPhoto(
            item_id=item_id,
            filename=unique_name,
            url=f"/api/photos/{unique_name}",  # placeholder; overwritten after insert
            sort_order=existing_count + idx,
            data=contents,
            mime_type=mime,
        )
        db.add(photo)
        db.flush()  # get the id assigned
        # Set url to use the real id-based route
        photo.url = f"/api/photos/{photo.id}"
        created.append(photo)

    db.commit()
    for photo in created:
        db.refresh(photo)
    return created


@router.delete("/{item_id}/photos/{photo_id}", status_code=204)
def delete_photo(
    item_id: str,
    photo_id: str,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    photo = (
        db.query(ItemPhoto)
        .filter(ItemPhoto.id == photo_id, ItemPhoto.item_id == item_id)
        .first()
    )
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    db.delete(photo)
    db.commit()
    return None


@router.put("/{item_id}/photos/reorder")
def reorder_photos(
    item_id: str,
    photo_ids: List[str] = Body(..., embed=False),
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    for idx, photo_id in enumerate(photo_ids):
        db.query(ItemPhoto).filter(
            ItemPhoto.id == photo_id,
            ItemPhoto.item_id == item_id,
        ).update({"sort_order": idx})
    db.commit()
    return {"ok": True}


def make_photo_router() -> APIRouter:
    """Separate router for the /api/photos/{id} serve route (no /items prefix)."""
    serve_router = APIRouter(tags=["photos"])

    @serve_router.get("/photos/{photo_id}")
    def serve_photo(photo_id: str, db: Session = Depends(get_db)):
        photo = db.query(ItemPhoto).filter(ItemPhoto.id == photo_id).first()
        if not photo or photo.data is None:
            raise HTTPException(404, "Photo not found")

        stored_mime = (photo.mime_type or "").lower()
        if stored_mime in INLINE_SAFE_MIME:
            media_type = stored_mime
            disposition = "inline"
        else:
            media_type = "application/octet-stream"
            disposition = "attachment"

        return Response(
            content=bytes(photo.data),
            media_type=media_type,
            headers={
                "Cache-Control": "public, max-age=86400",
                "X-Content-Type-Options": "nosniff",
                "Content-Disposition": disposition,
            },
        )

    return serve_router

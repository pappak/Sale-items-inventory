import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import Item, ItemPhoto

router = APIRouter(prefix="/items", tags=["photos"])

# Absolute path so it works regardless of cwd in deployment
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "uploads"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    created = []
    for idx, file in enumerate(files):
        safe_name = os.path.basename(file.filename or "unnamed")
        unique_name = f"{uuid.uuid4()}_{safe_name}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        contents = file.file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        photo = ItemPhoto(
            item_id=item_id,
            filename=unique_name,
            url=f"/uploads/{unique_name}",
            sort_order=idx,
        )
        db.add(photo)
        created.append(photo)

    db.commit()
    for photo in created:
        db.refresh(photo)
    return created


@router.delete("/{item_id}/photos/{photo_id}", status_code=204)
def delete_photo(item_id: str, photo_id: str, db: Session = Depends(get_db)):
    photo = (
        db.query(ItemPhoto)
        .filter(ItemPhoto.id == photo_id, ItemPhoto.item_id == item_id)
        .first()
    )
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    file_path = os.path.join(UPLOAD_DIR, photo.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(photo)
    db.commit()
    return None


@router.put("/{item_id}/photos/reorder")
def reorder_photos(
    item_id: str,
    photo_ids: List[str] = Body(..., embed=False),
    db: Session = Depends(get_db),
):
    """Accepts an ordered list of photo IDs and updates sort_order accordingly."""
    for idx, photo_id in enumerate(photo_ids):
        db.query(ItemPhoto).filter(
            ItemPhoto.id == photo_id,
            ItemPhoto.item_id == item_id,
        ).update({"sort_order": idx})
    db.commit()
    return {"ok": True}

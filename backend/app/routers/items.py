from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import Item, ItemPhoto
from backend.app.routers.auth import require_admin

router = APIRouter(prefix="/items", tags=["items"])


class ItemCreate(BaseModel):
    title: str
    description: str | None = None
    category: str | None = None
    condition: str | None = None
    dimensions: str | None = None
    provenance: str | None = None
    estimated_value: float | None = None
    asking_price: float | None = None


class ItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    condition: str | None = None
    dimensions: str | None = None
    provenance: str | None = None
    estimated_value: float | None = None
    asking_price: float | None = None
    is_sold: bool | None = None


class PhotoOut(BaseModel):
    id: str
    filename: str
    url: str
    sort_order: int

    class Config:
        from_attributes = True


class ItemOut(BaseModel):
    id: str
    title: str
    description: str | None = None
    category: str | None = None
    condition: str | None = None
    dimensions: str | None = None
    provenance: str | None = None
    estimated_value: float | None = None
    asking_price: float | None = None
    is_sold: bool = False
    share_token: str
    created_at: datetime
    updated_at: datetime
    photos: List[PhotoOut]

    class Config:
        from_attributes = True


@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    from sqlalchemy import distinct
    rows = db.query(distinct(Item.category)).filter(Item.category.isnot(None), Item.category != '').all()
    cats = sorted([r[0] for r in rows])
    return cats


@router.get("", response_model=List[ItemOut])
def list_items(category: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Item)
    if category:
        query = query.filter(Item.category == category)
    items = query.order_by(Item.created_at.desc()).all()
    return items


@router.get("/{item_id}", response_model=ItemOut)
def get_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("", response_model=ItemOut, status_code=201)
def create_item(body: ItemCreate, db: Session = Depends(get_db), _: bool = Depends(require_admin)):
    item = Item(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ItemOut)
def update_item(item_id: str, body: ItemUpdate, db: Session = Depends(get_db), _: bool = Depends(require_admin)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: str, db: Session = Depends(get_db), _: bool = Depends(require_admin)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    # Delete associated photo files
    for photo in item.photos:
        import os
        path = os.path.join("uploads", photo.filename)
        if os.path.exists(path):
            os.remove(path)
    db.delete(item)
    db.commit()
    return None


@router.post("/{item_id}/toggle-sold", response_model=ItemOut)
def toggle_sold(item_id: str, db: Session = Depends(get_db), _: bool = Depends(require_admin)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_sold = not item.is_sold
    db.commit()
    db.refresh(item)
    return item

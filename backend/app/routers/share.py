from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import Item, ItemPhoto, ShareLink

router = APIRouter(prefix="/share-links", tags=["share"])


class ShareLinkCreate(BaseModel):
    scope: str
    category: str | None = None
    item_id: str | None = None
    label: str | None = None


class ShareLinkOut(BaseModel):
    id: str
    token: str
    scope: str
    category: str | None = None
    item_id: str | None = None
    label: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


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
    share_token: str
    created_at: datetime
    updated_at: datetime
    photos: List[PhotoOut]

    class Config:
        from_attributes = True


@router.get("", response_model=List[ShareLinkOut])
def list_share_links(db: Session = Depends(get_db)):
    return db.query(ShareLink).order_by(ShareLink.created_at.desc()).all()


@router.post("", response_model=ShareLinkOut, status_code=201)
def create_share_link(body: ShareLinkCreate, db: Session = Depends(get_db)):
    link = ShareLink(**body.model_dump())
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.delete("/{link_id}", status_code=204)
def delete_share_link(link_id: str, db: Session = Depends(get_db)):
    link = db.query(ShareLink).filter(ShareLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Share link not found")
    db.delete(link)
    db.commit()
    return None


# Public endpoint (no auth)
public_router = APIRouter(tags=["public"])


@public_router.get("/public/{token}", response_model=List[ItemOut])
def public_share(token: str, db: Session = Depends(get_db)):
    link = db.query(ShareLink).filter(ShareLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Invalid share link")

    if link.scope == "all":
        items = db.query(Item).order_by(Item.created_at.desc()).all()
    elif link.scope == "category":
        if not link.category:
            raise HTTPException(status_code=400, detail="Category scope missing category value")
        items = (
            db.query(Item)
            .filter(Item.category == link.category)
            .order_by(Item.created_at.desc())
            .all()
        )
    elif link.scope == "item":
        if not link.item_id:
            raise HTTPException(status_code=400, detail="Item scope missing item_id value")
        item = db.query(Item).filter(Item.id == link.item_id).first()
        items = [item] if item else []
    else:
        raise HTTPException(status_code=400, detail="Invalid share scope")

    return items

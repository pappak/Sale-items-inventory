import uuid
from datetime import datetime, timezone

from sqlalchemy import ForeignKey, String, Text, Numeric, DateTime, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Item(Base):
    __tablename__ = "items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    condition: Mapped[str | None] = mapped_column(String, nullable=True)
    dimensions: Mapped[str | None] = mapped_column(String, nullable=True)
    provenance: Mapped[str | None] = mapped_column(String, nullable=True)
    estimated_value: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    asking_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    share_token: Mapped[str] = mapped_column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    is_sold: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    photos: Mapped[list["ItemPhoto"]] = relationship(
        "ItemPhoto", back_populates="item", cascade="all, delete-orphan", lazy="selectin"
    )


class ItemPhoto(Base):
    __tablename__ = "item_photos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id: Mapped[str] = mapped_column(String(36), ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    data: Mapped[bytes | None] = mapped_column(nullable=True)
    mime_type: Mapped[str] = mapped_column(String, nullable=False, server_default="application/octet-stream")

    item: Mapped["Item"] = relationship("Item", back_populates="photos")


class ShareLink(Base):
    __tablename__ = "share_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token: Mapped[str] = mapped_column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    scope: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    item_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    label: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

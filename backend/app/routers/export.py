import os
from datetime import datetime, timezone
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import Item, ShareLink

router = APIRouter(prefix="/export", tags=["export"])

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "uploads"
)


def _build_pdf(items: list, label: str | None = None) -> bytes:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        Image as RLImage, PageBreak, HRFlowable,
    )

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CatalogTitle", parent=styles["Title"],
        fontSize=28, spaceAfter=6, textColor=colors.HexColor("#1a1a2e"),
    )
    heading_style = ParagraphStyle(
        "ItemHeading", parent=styles["Heading2"],
        fontSize=14, spaceAfter=4, textColor=colors.HexColor("#1a1a2e"),
    )
    meta_style = ParagraphStyle(
        "Meta", parent=styles["Normal"],
        fontSize=9, textColor=colors.HexColor("#555555"), spaceAfter=2,
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, leading=14, spaceAfter=6,
    )

    story = []
    now = datetime.now(timezone.utc).strftime("%B %d, %Y")
    catalog_title = label or "Inventory Catalog"

    # Cover
    story.append(Paragraph(catalog_title, title_style))
    story.append(Paragraph(f"Generated on {now}", meta_style))
    story.append(Spacer(1, 0.3 * inch))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#dddddd")))
    story.append(Spacer(1, 0.2 * inch))

    for item in items:
        story.append(Paragraph(item.title or "Untitled", heading_style))

        # Meta row
        meta_parts = []
        if item.category:
            meta_parts.append(f"<b>Category:</b> {item.category}")
        if item.condition:
            meta_parts.append(f"<b>Condition:</b> {item.condition}")
        if item.dimensions:
            meta_parts.append(f"<b>Dimensions:</b> {item.dimensions}")
        if item.estimated_value:
            meta_parts.append(f"<b>Est. Value:</b> ${item.estimated_value:,.2f}")
        if item.asking_price:
            meta_parts.append(f"<b>Asking Price:</b> ${item.asking_price:,.2f}")
        if item.provenance:
            meta_parts.append(f"<b>Provenance:</b> {item.provenance}")
        if meta_parts:
            story.append(Paragraph("  ·  ".join(meta_parts), meta_style))
            story.append(Spacer(1, 0.05 * inch))

        if item.description:
            story.append(Paragraph(item.description, body_style))

        # Photos — up to 3 per row
        photo_images = []
        for photo in item.photos:
            file_path = os.path.join(UPLOAD_DIR, photo.filename)
            if os.path.exists(file_path):
                try:
                    img = RLImage(file_path, width=2 * inch, height=1.5 * inch, kind="proportional")
                    photo_images.append(img)
                except Exception:
                    pass

        if photo_images:
            # Chunk into rows of 3
            row_size = 3
            for i in range(0, len(photo_images), row_size):
                row = photo_images[i:i + row_size]
                # Pad with empty cells
                while len(row) < row_size:
                    row.append("")
                tbl = Table([row], colWidths=[2.2 * inch] * row_size)
                tbl.setStyle(TableStyle([
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ]))
                story.append(tbl)
                story.append(Spacer(1, 0.1 * inch))

        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#eeeeee")))
        story.append(Spacer(1, 0.2 * inch))

    doc.build(story)
    return buf.getvalue()


@router.get("/pdf")
def export_pdf(
    scope: str = Query(..., pattern="^(all|category|item)$"),
    id: str | None = Query(None),
    label: str | None = Query(None),
    db: Session = Depends(get_db),
):
    items: list[Item] = []

    if scope == "all":
        items = db.query(Item).order_by(Item.created_at.desc()).all()
    elif scope == "category":
        if not id:
            raise HTTPException(status_code=400, detail="id (category name) required for category scope")
        items = db.query(Item).filter(Item.category == id).order_by(Item.created_at.desc()).all()
    elif scope == "item":
        if not id:
            raise HTTPException(status_code=400, detail="id (item id) required for item scope")
        item = db.query(Item).filter(Item.id == id).first()
        items = [item] if item else []

    if not items:
        raise HTTPException(status_code=404, detail="No items found for export")

    try:
        pdf_bytes = _build_pdf(items, label)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}")

    filename = f"inventory_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

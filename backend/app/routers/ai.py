import base64
import json
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import Item

router = APIRouter(prefix="/items", tags=["ai"])

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "uploads"
)


class DescriptionResponse(BaseModel):
    title: str
    description: str
    condition: str
    category: str


class CategorySuggestion(BaseModel):
    category: str | None = None
    questions: list[str] | None = None
    description: str | None = None
    title: str | None = None
    estimated_value: float | None = None


@router.post("/suggest-category", response_model=CategorySuggestion)
def suggest_category(body: dict):
    title = (body.get("title") or "").strip()
    if not title:
        return CategorySuggestion(questions=["What type of item is this?"])

    from openai import OpenAI

    client = OpenAI(api_key=os.environ.get("OPENA1_OPENAI_API_KEY"))

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert appraiser helping write secondhand sale listings. "
                    "Available categories: Photography Gear, Bikes, Arts & Crafts / Hobbies, General.\n\n"
                    "Given an item title, do the following:\n"
                    "1. Identify the item using your knowledge (model specs, features, typical use).\n"
                    "2. If you can confidently identify it, return JSON with:\n"
                    '   {"category": "<one of the 5 categories>", '
                    '"title": "<clean precise product title>", '
                    '"description": "<3-4 sentence detailed description drawing on your knowledge '
                    "of this specific product — mention key specs, what it's known for, why "
                    'a buyer would want it. Written for an auction listing.>", '
                    '"estimated_value": <current used street price in USD as a number, no symbols>}\n'
                    "3. If the item is too vague to identify, return:\n"
                    '   {"questions": ["<short clarifying question>", ...]} (max 2 questions)\n'
                    "Never return both category and questions. Never return markdown or code fences."
                ),
            },
            {"role": "user", "content": f"Item title: {title}"},
        ],
        max_tokens=400,
    )

    raw = (response.choices[0].message.content or "").strip()
    cleaned = raw.strip("`").strip()
    if cleaned.startswith("json"):
        cleaned = cleaned[4:].strip()
    try:
        parsed = json.loads(cleaned)
        return CategorySuggestion(
            category=parsed.get("category"),
            questions=parsed.get("questions"),
            description=parsed.get("description"),
            title=parsed.get("title"),
            estimated_value=parsed.get("estimated_value"),
        )
    except json.JSONDecodeError:
        return CategorySuggestion(questions=["What type of item is this?"])


@router.post("/{item_id}/generate-description", response_model=DescriptionResponse)
def generate_description(item_id: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if not item.photos:
        raise HTTPException(status_code=400, detail="Item has no photos to analyze")

    images = []
    for photo in item.photos:
        file_path = os.path.join(UPLOAD_DIR, photo.filename)
        if not os.path.exists(file_path):
            continue
        with open(file_path, "rb") as f:
            data = f.read()
        b64 = base64.b64encode(data).decode("utf-8")
        # Determine MIME type from extension
        ext = os.path.splitext(photo.filename)[1].lower()
        mime = "image/jpeg"
        if ext == ".png":
            mime = "image/png"
        elif ext == ".gif":
            mime = "image/gif"
        elif ext == ".webp":
            mime = "image/webp"
        images.append(f"data:{mime};base64,{b64}")

    if not images:
        raise HTTPException(status_code=400, detail="No photo files found on disk")

    from openai import OpenAI

    client = OpenAI(api_key=os.environ.get("OPENA1_OPENAI_API_KEY"))

    content = [
        {
            "type": "text",
            "text": (
                "You are helping sell secondhand items. Analyze the photos and return "
                "ONLY valid JSON with keys: title (5-8 word concise title), description "
                "(2-3 sentence detailed description good for auction listings), condition "
                "(one of: New, Like New, Good, Fair, Poor), category (one of: Photography Gear, "
                "Bikes, Arts & Crafts / Hobbies, General)"
            ),
        }
    ]
    for img_url in images:
        content.append({"type": "image_url", "image_url": {"url": img_url}})

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates item listings."},
            {"role": "user", "content": content},
        ],
        max_tokens=800,
    )

    raw = response.choices[0].message.content or ""
    # Strip markdown code fences if present
    cleaned = raw.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI response was not valid JSON: {exc}. Raw: {raw[:200]}",
        )

    return DescriptionResponse(
        title=parsed.get("title", ""),
        description=parsed.get("description", ""),
        condition=parsed.get("condition", ""),
        category=parsed.get("category", ""),
    )

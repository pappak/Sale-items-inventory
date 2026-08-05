# Inventory Listing Generator

## Context
User has a large variety of items to sell (camera gear, bikes, N-scale trains, airbrush equipment, general items). Needs a tool to photograph items, add metadata, generate shareable links, export PDFs, and send to auction houses or individual buyers.

## Scope
- Full web app (FastAPI backend + React frontend)
- Create/edit/delete item listings with multiple photo uploads
- AI-assisted description writing (Gemini vision — analyze uploaded photos)
- Flexible sharing: individual item, by category, or entire inventory (read-only public views)
- PDF export: single item, category, or all
- Publicly hosted via Workshop publish

**Non-goals (v1):**
- Buyer accounts / messaging
- Payment processing
- Live auction features
- Mobile app

---

## Tech Stack
| Layer | Choice | Reason |
|---|---|---|
| Backend | FastAPI (Python) | Simple, fast, async file uploads |
| Frontend | React + Vite + Tailwind | Clean admin UI + public share views |
| Database | Neon Postgres (Workshop) | Persistent, managed |
| Photo storage | Neon Postgres blob / local + persist-user-uploads skill | Survives container restarts |
| AI | GPT-4o vision (OpenAI, env prefix `OPENA1`) | Photo → title + description generation |
| PDF | WeasyPrint or ReportLab | Python-native catalog generation |
| Hosting | Workshop publish | Public URLs for share links |

---

## Data Model

### `items` table
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| title | text | |
| description | text | |
| category | text | e.g. "Photography Gear", "Bikes", "Trains", "Other" |
| condition | text | New / Like New / Good / Fair / Poor |
| dimensions | text | freeform "24 x 12 x 8 in" |
| provenance | text | ownership history, purchase receipt info |
| estimated_value | numeric | |
| asking_price | numeric | |
| share_token | UUID | unique per item, used in public URLs |
| created_at | timestamp | |
| updated_at | timestamp | |

### `item_photos` table
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| item_id | UUID FK | |
| filename | text | stored filename |
| url | text | accessible path |
| sort_order | int | primary photo = 0 |
| created_at | timestamp | |

### `share_links` table (for category/all shares)
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| token | UUID | URL-safe token |
| scope | text | "all" or "category" |
| category | text | null if scope=all |
| label | text | custom label e.g. "Photo Gear for Christie's" |
| created_at | timestamp | |

---

## API Routes

### Admin (protected — only accessible when running locally or with a simple password)
- `POST /api/items` — create item
- `PUT /api/items/{id}` — update item
- `DELETE /api/items/{id}` — delete item
- `POST /api/items/{id}/photos` — upload photos
- `DELETE /api/items/{id}/photos/{photo_id}` — remove photo
- `POST /api/items/{id}/generate-description` — Gemini vision → fill title/description
- `GET /api/items` — list all with filtering by category
- `POST /api/share-links` — create a share link (scope: item/category/all)
- `GET /api/share-links` — list all share links
- `DELETE /api/share-links/{id}` — revoke share link
- `GET /api/export/pdf?scope=all|category|item&id=...` — generate and download PDF

### Public (no auth — accessed via share token)
- `GET /share/{token}` → React renders public view
- `GET /api/public/{token}` — returns item(s) data for the token

---

## Frontend Pages

### Admin UI
1. **Dashboard** — item grid with photos, category filter, search
2. **Add/Edit Item** — form with all fields + multi-photo upload drag & drop
3. **AI Assist panel** — "Generate from photos" button → fills title + description
4. **Share Manager** — create/copy/revoke share links (item / category / all)
5. **Export** — download PDF for selected scope

### Public View (share link)
- Clean read-only catalog layout
- Responsive, good for mobile (auction house staff viewing on phone)
- Shows: photos (gallery), title, description, condition, dimensions, provenance, estimated value, asking price
- No admin controls visible
- Branding: simple, professional

---

## AI Description Flow
1. User uploads photos for an item
2. Clicks "✨ Generate Description"
3. Backend sends photo(s) to GPT-4o vision with prompt:
   > "You are helping sell this item. Based on these photos, write: 1) A concise title (5-8 words), 2) A detailed description (2-3 sentences), 3) Likely condition (New/Like New/Good/Fair/Poor). Return JSON."
4. Response populates title + description fields (editable before saving)

---

## PDF Export Format
- Cover page: "Inventory — [date]" or "[Category] — for [label]"
- One item per page (or condensed 2-up for many items)
- Photos grid (up to 4 photos), all fields below
- Page numbers, item ID for reference
- Generated with WeasyPrint from HTML template

---

## Sharing Model
| Share type | URL | What's shown |
|---|---|---|
| Single item | `/share/{item.share_token}` | That item only |
| Category | `/share/{share_link.token}` | All items in category |
| Everything | `/share/{share_link.token}` | Full inventory |

Share tokens are UUIDs — unguessable, revocable.

---

## Implementation Plan

### Phase 1 — Backend foundation
1. `uv init` + FastAPI + SQLAlchemy + Alembic setup
2. Enable Neon DB (Workshop database connector)
3. Define models + run migration
4. Photo upload endpoint + persist-user-uploads skill
5. CRUD endpoints for items + photos

### Phase 2 — AI integration
6. Install `openai` SDK (env: `OPENA1_API_KEY`)
7. `/generate-description` endpoint — send photos to GPT-4o vision, return JSON
8. Prompt tuning for item types (gear, bikes, trains)

### Phase 3 — Sharing + PDF
9. Share link CRUD + public API endpoint
10. WeasyPrint PDF generation with HTML template

### Phase 4 — Frontend
11. Vite + React + Tailwind scaffold
12. Admin: dashboard, add/edit item form, photo upload
13. AI assist panel wired to backend
14. Share manager UI
15. Public share view (catalog layout)
16. PDF export button

### Phase 5 — Deploy
17. Workshop publish config
18. Environment variable wiring
19. Smoke test end-to-end

---

## Verification
- Add a test item with 3 photos → AI generates description → save
- Create share link (all, category, single) → open in incognito → verify public view
- Export PDF → check all fields + photos render correctly
- Deploy → verify share links work from external network

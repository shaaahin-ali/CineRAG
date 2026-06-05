# API Reference

Base URL: `http://localhost:8000` (dev) | `https://cinephile-backend.onrender.com` (prod)

All endpoints except `/health` require: `Authorization: Bearer <supabase_jwt>`

---

## Health

### `GET /api/v1/health`
```json
{"status": "ok", "version": "1.0.0", "service": "CinePhile Malayalam Edition"}
```

---

## Projects

### `POST /api/v1/projects`
Create a new project.
```json
// Request
{"title": "Kumbalangi Nights", "description": "Optional"}

// Response 201
{
  "id": "uuid",
  "title": "Kumbalangi Nights",
  "owner_id": "uuid",
  "status": "uploading",
  "created_at": "2026-06-05T..."
}
```

### `GET /api/v1/projects`
List accessible projects (owned + member of). Returns array of ProjectOut.

### `GET /api/v1/projects/{id}`
Get single project details.

### `DELETE /api/v1/projects/{id}`
Delete project (owner only). Returns 204.

### `GET /api/v1/projects/{id}/status`
```json
{
  "project_id": "uuid",
  "status": "ready",
  "progress_message": "Ready — start querying!",
  "scene_count": 87,
  "page_count": 112
}
```

---

## Upload

### `POST /api/v1/projects/{id}/upload`
Upload screenplay file. Accepts `multipart/form-data`.
- Field: `file` (PDF, DOCX, or TXT, max 50MB)

```json
// Response 202
{
  "project_id": "uuid",
  "file_url": "https://...",
  "status": "indexing",
  "message": "Screenplay uploaded. Ingestion pipeline started in background."
}
```

---

## Queries (SSE Streaming)

### `POST /api/v1/projects/{id}/query`
Submit a query. Returns **Server-Sent Events stream**.

```json
// Request body
{
  "query": "Describe the protagonist's emotional journey",
  "language": "en",  // or "ml" — auto-detected if omitted
  "user_role": "actor"  // actor|director|cinematographer|music|editor|producer
}
```

**SSE Events:**
```
event: citation
data: {"scene_number": 14, "page_start": 42, "page_end": 44, "heading": "INT. KITCHEN - NIGHT", "location": "KITCHEN", "characters": ["HARI", "ANMOL"], "excerpt": "..."}

event: token
data: {"token": "In Scene 14"}

event: token
data: {"token": ", Hari..."}

event: done
data: {"query_id": "uuid", "latency_ms": 1240}

event: error
data: {"error": "..."}
```

### `GET /api/v1/projects/{id}/queries`
Get query history (last 50, own queries only).

### `POST /api/v1/projects/{id}/queries/{qid}/bookmark`
Toggle bookmark. Returns `{"query_id": "uuid", "bookmarked": true}`.

### `POST /api/v1/projects/{id}/translate`
Translate text between Malayalam and English.
```json
// Request
{"text": "...", "source_lang": "ml", "target_lang": "en"}

// Response
{"translated_text": "...", "source_lang": "ml", "target_lang": "en"}
```

---

## Scenes

### `GET /api/v1/projects/{id}/scenes`
Query params: `location`, `int_ext` (INT/EXT/INT/EXT), `character`

### `GET /api/v1/projects/{id}/characters`
```json
[
  {"name": "HARI", "scene_count": 45, "scenes": [1,2,5,7,...]},
  {"name": "ANMOL", "scene_count": 32, "scenes": [1,3,4,...]}
]
```

---

## Team

### `POST /api/v1/projects/{id}/invite`
```json
{"email": "director@film.com", "role": "director"}
```
Roles: `producer | director | actor | cinematographer | editor | music | viewer`

### `GET /api/v1/projects/{id}/members`
### `DELETE /api/v1/projects/{id}/members/{user_id}`

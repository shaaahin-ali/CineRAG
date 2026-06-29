# CineRAG — Production Readiness Plan
> Goal: Handle many concurrent users, never crash on release, stay maintainable with minimal complexity. All free tier.

---

## Current Architecture (What You Have)

```
Browser (Next.js on Vercel)
    ↕ HTTPS/SSE
FastAPI (Uvicorn, single worker, your laptop)
    ↕
Supabase (Postgres + Storage)   Pinecone (vectors)
Cohere (rerank)                 Pollinations (images)
OpenRouter / Gemini (LLM)
```

**The #1 problem**: Your backend runs on your laptop with `uvicorn --reload`. Every user hits the same single Python process. When it crashes, everyone is offline.

---

## The 5 Real Threats to Uptime

| # | Threat | Current State | Impact |
|---|---|---|---|
| 1 | **Single process crash** | `--reload` dev mode | Full outage |
| 2 | **Concurrent LLM calls** | No concurrency limit | API rate limits hit, errors for all users |
| 3 | **Ingestion blocks the event loop** | `asyncio.create_task` in background | Memory spike per upload |
| 4 | **No per-user rate limiting** | `slowapi` installed but not applied to routes | One user can spam and exhaust LLM quota |
| 5 | **JWT not verified** | Signature skipped (demo mode) | Anyone can call any endpoint |

---

## Phase 1 — Fix Crashes & Concurrency (Do This First, No New Services)

### 1.1 — Apply Rate Limits to All Routes

**Problem**: `slowapi` is set up in `main.py` but `@limiter.limit()` is not applied to any route. One user can fire 100 queries per second, exhausting your free OpenRouter quota for everyone.

**Fix**: Add `@limiter.limit()` decorators to the 3 heavy endpoints.

#### [MODIFY] [query.py](file:///c:/Users/shahi/CINERAG/apps/backend/app/api/query.py)
```python
# Line 82 — add before @router.post
@limiter.limit("10/minute")   # 10 queries per user per minute
async def query_screenplay(...):
```

#### [MODIFY] [upload.py](file:///c:/Users/shahi/CINERAG/apps/backend/app/api/upload.py)
```python
# Line 44 — add before async def upload_screenplay
@limiter.limit("5/hour")     # 5 uploads per user per hour
async def upload_screenplay(...):
```

#### [MODIFY] [graph_explain.py](file:///c:/Users/shahi/CINERAG/apps/backend/app/api/graph_explain.py)
```python
@limiter.limit("30/minute")  # graph clicks
async def explain_character_or_edge(...):
```

**Priority: HIGH — do before any public release**

---

### 1.2 — Add Global Timeout to All LLM Calls

**Problem**: If OpenRouter or Gemini hangs, the SSE stream hangs forever, holding the connection open and leaking memory.

**Fix**: Wrap all LLM calls in `asyncio.wait_for(...)` with a 45-second timeout.

#### [MODIFY] [generation.py](file:///c:/Users/shahi/CINERAG/apps/backend/app/services/generation.py)
```python
# Wrap the OpenRouter call at line ~153
try:
    response = await asyncio.wait_for(
        client.chat.completions.create(...),
        timeout=45.0
    )
except asyncio.TimeoutError:
    yield {"type": "token", "token": "\n\n[Response timed out. Please try again.]"}
    yield {"type": "done"}
    return
```

**Priority: HIGH**

---

### 1.3 — Limit Concurrent Ingestion Jobs

**Problem**: If 10 users upload at once, 10 `asyncio.create_task()` ingestion jobs run simultaneously. Each calls Pinecone, Gemini, and Pollinations at once → all 3 hit rate limits → all 10 fail.

**Fix**: Add a `asyncio.Semaphore` to cap concurrent ingestion at 3.

#### [MODIFY] [ingestion.py](file:///c:/Users/shahi/CINERAG/apps/backend/app/services/ingestion.py)
```python
# Top of file — add:
import asyncio
_ingestion_semaphore = asyncio.Semaphore(3)  # max 3 concurrent ingestion jobs

# Wrap run_ingestion_pipeline body:
async with _ingestion_semaphore:
    # ... existing pipeline code
```

**Priority: HIGH**

---

### 1.4 — Fix JWT Verification (Security)

**Problem**: `security.py` line 34 says `"Demo mode: skips signature verification"`. Anyone who has a valid Supabase anon key can forge a user_id and access any project.

**Fix**: Use `pyjwt` (already in requirements.txt) to verify the Supabase JWT secret.

#### [MODIFY] [security.py](file:///c:/Users/shahi/CINERAG/apps/backend/app/core/security.py)
```python
import jwt  # pyjwt — already installed

def verify_token(token: str) -> dict:
    payload = jwt.decode(
        token,
        settings.SUPABASE_ANON_KEY,  # Supabase signs with this key
        algorithms=["HS256"],
        options={"verify_exp": True},
    )
    return payload
```

**Priority: HIGH (before any public users)**

---

## Phase 2 — Deploy to Always-On Free Hosting

**Problem**: Your laptop going to sleep = everyone offline.

### 2.1 — Backend → Railway (Free Tier)

Railway gives you 500 free hours/month (~20 days). No config needed, just connect GitHub.

**Steps:**
1. Push your code to GitHub
2. Go to **https://railway.app** → New Project → Deploy from GitHub → select `CINERAG`
3. Set **Root Directory** = `apps/backend`
4. Set **Start Command** = `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2`
5. Add all env vars from your `.env.local` in Railway's Variables tab
6. Railway gives you a URL like `https://cinerag-backend.up.railway.app`

> [!IMPORTANT]
> Change `--workers 2` (not 1). This means 2 Python processes handle requests in parallel. Cost: free.

### 2.2 — Frontend → Vercel (Already Free)

Next.js deploys to Vercel in one click. Vercel handles unlimited concurrent users for free on hobby plan.

**Steps:**
1. Go to **https://vercel.com** → Import Git Repository → select `CINERAG`
2. Set **Root Directory** = `apps/frontend`
3. Add env var: `NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app`
4. Deploy

**After this your architecture becomes:**
```
Browser → Vercel (unlimited scale, CDN)
              ↕
         Railway (2 workers, always on)
              ↕
    Supabase / Pinecone / Gemini (all cloud)
```

---

## Phase 3 — Add a Health Check Endpoint

**Problem**: You currently have `/api/v1/health` but it doesn't check if Pinecone or Supabase are actually reachable. Railway will keep restarting a broken container without telling you why.

#### [MODIFY] [health.py](file:///c:/Users/shahi/CINERAG/apps/backend/app/api/health.py)
Expand to check all dependencies:
```python
@router.get("/health")
async def health():
    checks = {"api": "ok", "supabase": "unknown", "pinecone": "unknown"}
    try:
        db = SupabaseClient()
        db.table("projects").select("id").limit(1).execute()
        checks["supabase"] = "ok"
    except:
        checks["supabase"] = "error"
    # Add Pinecone check similarly
    status_code = 200 if all(v == "ok" for v in checks.values()) else 503
    return JSONResponse(checks, status_code=status_code)
```

Railway uses this to restart the container automatically if it goes unhealthy.

**Priority: MEDIUM**

---

## Phase 4 — Crash-Proof the SSE Stream

**Problem**: If the LLM stream raises an exception mid-stream, FastAPI sends a broken SSE event. The frontend `useSSE.ts` hook may hang forever.

**Fix**: Wrap the entire `sse_generator` in try/except/finally and always emit a `done` event.

#### [MODIFY] [query.py](file:///c:/Users/shahi/CINERAG/apps/backend/app/api/query.py)
```python
async def sse_generator(...):
    try:
        async for event in stream_rag_response(...):
            yield ...
    except Exception as e:
        logger.error(f"SSE fatal error: {e}", exc_info=True)
        yield f"event: error\ndata: {json.dumps({'error': 'Server error. Please try again.'})}\n\n"
    finally:
        yield f"event: done\ndata: {{}}\n\n"  # always close the stream
```

**Priority: HIGH**

---

## Phase 5 — Add `asyncio.timeout` to Pollinations Image Generation

**Problem**: `scene_images.py` has `timeout=60` on the aiohttp call, but if Pollinations goes down, 7 scenes × 60s = 7 minutes of blocked background task. This holds asyncio event loop resources.

**Fix**: Reduce to 30s timeout and add retry with backoff.

#### [MODIFY] [scene_images.py](file:///c:/Users/shahi/CINERAG/apps/backend/app/services/scene_images.py)
```python
# Line 285 — change timeout
timeout=aiohttp.ClientTimeout(total=30)  # was 60
```

**Priority: LOW**

---

## Summary: Priority Order

| Priority | Change | File | Time to implement |
|---|---|---|---|
| 🔴 HIGH | Apply `@limiter.limit()` to query/upload/graph routes | query.py, upload.py, graph_explain.py | 10 min |
| 🔴 HIGH | Fix JWT signature verification | security.py | 15 min |
| 🔴 HIGH | Always emit SSE `done` event on error | query.py | 10 min |
| 🔴 HIGH | Add 45s timeout to LLM calls | generation.py | 10 min |
| 🟡 MEDIUM | Add `Semaphore(3)` to ingestion | ingestion.py | 15 min |
| 🟡 MEDIUM | Expand health check endpoint | health.py | 20 min |
| 🟡 MEDIUM | Deploy backend to Railway | No code change | 30 min |
| 🟡 MEDIUM | Deploy frontend to Vercel | No code change | 15 min |
| 🟢 LOW | Reduce Pollinations timeout 60→30s | scene_images.py | 5 min |

---

## What This Gives You After All Changes

| Scenario | Before | After |
|---|---|---|
| Your laptop sleeps | Everyone offline | Railway keeps running |
| 1 user sends 100 queries | LLM quota exhausted for all | Blocked after 10/min |
| 3 users upload at once | All 3 ingestion jobs compete, 2 fail | Queue waits, all 3 succeed |
| LLM hangs mid-stream | Frontend freezes forever | 45s timeout, clean error |
| Forged JWT token | Any user ID accepted | Rejected at signature check |
| Railway container crashes | Manual restart | Auto-restart via health check |

> [!NOTE]
> No new databases, no Redis, no Celery, no Docker-Compose. Every fix is either a one-line decorator or a small code change. This keeps complexity low while making the app production-safe.

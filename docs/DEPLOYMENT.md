# Deployment Guide

## Frontend → Vercel

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
vercel login
```

### Step 2: Deploy
```bash
cd apps/frontend
vercel deploy --prod
```

### Step 3: Set Environment Variables in Vercel Dashboard
```
NEXT_PUBLIC_API_URL = https://cinephile-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL = https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = YOUR_ANON_KEY
NEXTAUTH_URL = https://YOUR_APP.vercel.app
NEXTAUTH_SECRET = YOUR_SECRET
```

---

## Backend → Render

### Step 1: Push to GitHub
```bash
git push origin main
```

### Step 2: Create Render Service
1. Go to https://render.com → New → Web Service
2. Connect GitHub → select CineRAG repo
3. Settings:
   - **Runtime:** Python 3.11
   - **Root Directory:** apps/backend
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/api/v1/health`

### Step 3: Set Environment Variables
Copy all values from `apps/backend/.env.example` into Render environment variables panel.

### Step 4: Keepalive (Prevent 50s Cold Starts)
1. Go to https://cron-job.org
2. Create scheduled job:
   - **URL:** `https://cinephile-backend.onrender.com/api/v1/health`
   - **Interval:** Every 14 minutes
3. This keeps Render warm on the free tier.

---

## Supabase Setup

### 1. Create Project
Go to https://supabase.com → New Project

### 2. Run SQL Schema
Go to SQL Editor → paste and run:
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'uploading'
    CHECK(status IN ('uploading','indexing','ready','error')),
  file_url TEXT,
  page_count INTEGER,
  scene_count INTEGER,
  character_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible projects"
  ON projects FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update projects"
  ON projects FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete projects"
  ON projects FOR DELETE USING (owner_id = auth.uid());

-- Project members table
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL
    CHECK(role IN ('producer','director','actor','cinematographer','editor','music','viewer')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their memberships"
  ON project_members FOR SELECT USING (user_id = auth.uid());

-- Queries table
CREATE TABLE queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  response_text TEXT,
  citations JSONB,
  detected_language TEXT,
  latency_ms INTEGER,
  tokens_used INTEGER,
  bookmarked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their queries"
  ON queries FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create queries"
  ON queries FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their queries"
  ON queries FOR UPDATE USING (user_id = auth.uid());

-- Scenes table
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  page_start INTEGER NOT NULL,
  page_end INTEGER NOT NULL,
  heading TEXT NOT NULL,
  location TEXT NOT NULL,
  time_of_day TEXT,
  int_ext TEXT CHECK(int_ext IN ('INT','EXT','INT/EXT')),
  characters TEXT[] DEFAULT '{}',
  content TEXT NOT NULL,
  detected_emotions TEXT[] DEFAULT '{}',
  estimated_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scenes from accessible projects"
  ON scenes FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    OR project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX scenes_location_idx ON scenes(location);
CREATE INDEX scenes_characters_idx ON scenes USING GIN(characters);
CREATE INDEX scenes_emotions_idx ON scenes USING GIN(detected_emotions);
CREATE INDEX projects_owner_idx ON projects(owner_id);
CREATE INDEX queries_user_idx ON queries(user_id);
CREATE INDEX queries_project_idx ON queries(project_id);
```

### 3. Create Storage Bucket
Go to Storage → New Bucket → `screenplays` (public)

### 4. Get API Keys
Settings → API → copy URL, anon key, service_role key

---

## Pinecone Setup

1. Go to https://pinecone.io → Create account
2. Create index:
   - **Name:** `cinephile`
   - **Dimension:** `3072` ← IMPORTANT (text-embedding-3-large)
   - **Metric:** `cosine`
   - **Mode:** Serverless
3. Copy API key

---

## GitHub Secrets (for CI/CD)

Set these in GitHub repo Settings → Secrets:
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
RENDER_DEPLOY_HOOK_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PINECONE_API_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
COHERE_API_KEY
```

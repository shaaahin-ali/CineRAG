# CinePhile Architecture — Malayalam Edition

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CinePhile Malayalam Edition                       │
│                   AI RAG Platform for Mollywood Film Crews              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    HTTPS/SSE     ┌─────────────────────────────────────┐
│   Next.js 14  │ ◄──────────────► │        FastAPI (Python 3.11)         │
│   (Vercel)    │                  │           (Render)                   │
│               │                  │                                      │
│  Bilingual UI │                  │  Malayalam NLP Pipeline:             │
│  ML + EN      │                  │  langdetect → Query Expansion        │
└──────────────┘                  │  → Emotion Detection                 │
                                  └──────────────┬──────────────────────┘
                                                 │
                    ┌────────────────────────────┼──────────────────────┐
                    │                            │                      │
                    ▼                            ▼                      ▼
          ┌─────────────────┐       ┌────────────────────┐   ┌─────────────────┐
          │    Supabase      │       │      Pinecone       │   │    Anthropic     │
          │  PostgreSQL +    │       │  Serverless Vector  │   │  Claude Sonnet  │
          │  Auth + RLS +    │       │  3072 dimensions    │   │   Streaming     │
          │  Storage         │       │  cosine similarity  │   │   SSE output    │
          └─────────────────┘       └────────────────────┘   └─────────────────┘
```

## Data Flow

### 1. Ingestion Pipeline (Upload → Index)

```
PDF/DOCX/TXT Upload
        │
        ▼
  PyMuPDF / python-docx
  (text extraction)
        │
        ▼
  MalayalamScreenplayParser
  • Unicode NFC normalization
  • Indic-NLP normalization
  • INT./EXT. scene detection
  • Malayalam ഉൾ/പുറ. detection
        │
        ▼
  Character extraction
  Emotion detection (MalayalamEmotionDetector)
  • 20-word emotion lexicon
  • Mollywood narrative beats
        │
        ▼
  Scene-aware chunker
  (≤3000 chars/chunk, 200-char overlap)
        │
        ▼
  OpenAI text-embedding-3-large
  (3072 dimensions, batch=100)
        │
        ▼
  ┌─────────────────────────────────────┐
  │  Parallel save:                     │
  │  Pinecone upsert (vectors)          │
  │  Supabase insert (scenes metadata)  │
  └─────────────────────────────────────┘
        │
        ▼
  Project status → "ready"
```

### 2. Query Pipeline (Question → Streaming Answer)

```
User Query (Malayalam or English)
        │
        ▼
  MalayalamQueryProcessor
  • langdetect (language detection)
  • Malayalam→English term expansion
  • Film terminology mapping
        │
        ▼
  OpenAI text-embedding-3-large
  (embed expanded query, 3072 dims)
        │
        ▼
  Pinecone vector search
  (top_k=20, filter by project_id)
        │
        ▼
  Cohere Rerank (top_n=5)
  (re-score for semantic relevance)
        │
        ▼
  Build context block + citations
        │
        ▼
  MalayalamSystemPrompt
  • Cultural framework
  • Role-specific context
        │
        ▼
  Claude Sonnet streaming
        │
        ▼
  SSE events → Frontend
  • event: citation (before text)
  • event: token (streaming text)
  • event: done (save to Supabase)
```

## Database Schema (Supabase PostgreSQL)

### projects
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| title | TEXT | Screenplay name |
| owner_id | UUID | → auth.users |
| status | TEXT | uploading/indexing/ready/error |
| file_url | TEXT | Supabase Storage URL |
| page_count | INTEGER | |
| scene_count | INTEGER | |
| character_count | INTEGER | |

### scenes
| Column | Type | Notes |
|--------|------|-------|
| scene_number | INTEGER | |
| page_start | INTEGER | |
| page_end | INTEGER | |
| int_ext | TEXT | INT/EXT/INT/EXT |
| location | TEXT | |
| characters | TEXT[] | Array of names |
| content | TEXT | Full scene text |
| detected_emotions | TEXT[] | Malayalam emotions |

### queries
| Column | Type | Notes |
|--------|------|-------|
| query_text | TEXT | |
| response_text | TEXT | Complete response |
| citations | JSONB | Array of citation objects |
| detected_language | TEXT | ml / en |
| latency_ms | INTEGER | |
| bookmarked | BOOLEAN | |

## Vector Index (Pinecone)

- **Index name:** cinephile
- **Dimension:** 3072 (text-embedding-3-large)
- **Metric:** cosine
- **Mode:** Serverless
- **Metadata per vector:** project_id, scene_number, page_start, page_end, heading, location, characters, content (≤2000 chars), detected_emotions

## Malayalam NLP Stack

| Component | Library | Purpose |
|-----------|---------|---------|
| Language Detection | langdetect | Detect ML vs EN |
| Unicode Normalization | Python unicodedata + Indic-NLP | Handle script variants |
| Tokenization | Indic-NLP | Proper agglutinative tokenization |
| Transliteration | unidecode | Fallback handling |
| Emotion Detection | Custom lexicon | 20-word Mollywood emotion vocabulary |
| Embeddings | text-embedding-3-large | 3072 dims — better multilingual |
| LLM | Claude Sonnet | Strong Malayalam comprehension |

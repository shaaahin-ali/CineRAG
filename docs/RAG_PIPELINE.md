# RAG Pipeline — Malayalam Edition

## Overview

CinePhile uses a Retrieval-Augmented Generation (RAG) pipeline optimized for Malayalam screenplays.

## Ingestion Pipeline

### 1. Text Extraction
```
PDF → PyMuPDF (fitz) → page-by-page text
DOCX → python-docx → paragraph text
TXT → UTF-8 decode
```

### 2. Malayalam-Aware Parsing

The `MalayalamScreenplayParser` applies:

**Unicode Normalization (NFC)**
- Handles Malayalam diacritic variations
- Ensures consistent representation of മ, ക, ്, etc.
- Applied before any regex matching

**Indic-NLP normalization** (if installed)
- Handles zero-width joiners/non-joiners
- Normalizes visually similar characters

**Scene Detection**
- English: `INT./EXT. LOCATION - TIME` regex
- Malayalam: `ഉൾ./പുറ. LOCATION` regex
- Mixed: handles English headings with Malayalam content

### 3. Emotion Detection

Per-scene emotion tagging using `MalayalamEmotionDetector`:
- 20-word Malayalam emotion lexicon
- Emotions stored in `detected_emotions[]` on scene records
- Also stored as Pinecone vector metadata for filtered retrieval

### 4. Chunking Strategy

**Scene-first:** Each scene is one chunk. Preserves citation accuracy.
- Small scenes (< 3000 chars) → 1 chunk
- Large scenes (≥ 3000 chars) → split with 200-char paragraph-boundary overlap
- Each sub-chunk retains full scene metadata (scene_number, page_start, page_end, etc.)

### 5. Embedding

- Model: `text-embedding-3-large`
- Dimensions: `3072`
- Batch size: 100 texts per API call
- Retry logic: exponential backoff (1s, 2s, 4s)
- Why 3072 dims? Better capture of Malayalam semantic nuance vs 1536-dim `3-small`

### 6. Pinecone Upsert

Vector metadata stored per chunk:
```json
{
  "project_id": "uuid",
  "scene_number": 14,
  "page_start": 42,
  "page_end": 44,
  "heading": "INT. KITCHEN - NIGHT",
  "location": "KITCHEN",
  "characters": ["HARI", "ANMOL"],
  "content": "...(first 2000 chars)...",
  "detected_emotions": ["love", "conflict"]
}
```

## Retrieval Pipeline

### 1. Query Processing

```python
MalayalamQueryProcessor.process_query(query)
→ {
    detected_language: "ml",  # langdetect
    expanded_query: "കഥ story plot narrative",  # term expansion
    film_terms_found: ["കഥ"]
}
```

**Why query expansion?**
Screenplay content may be in English while the query is in Malayalam. Expanding Malayalam film terms with their English equivalents bridges this gap in the embedding space.

### 2. Vector Search

```python
Pinecone.query(
    vector=embed(expanded_query),  # 3072-dim
    top_k=20,
    filter={"project_id": {"$eq": project_id}},
    include_metadata=True
)
```

### 3. Cohere Reranking

Rerank top 20 Pinecone results down to 5 using cross-encoder model.
- Uses full document text (not embeddings) for finer semantic scoring
- Falls back to Pinecone score order if Cohere API fails

### 4. Claude Streaming

**System prompt:** `MalayalamSystemPrompt.get_malayalam_context()` + role-specific prompt

**User message structure:**
```
Query: [original user query]
[If Malayalam: note about language]

RETRIEVED SCREENPLAY EXCERPTS:
─────────────────────────────────
[EXCERPT 1]
Scene 14 | Pages 42–44
Location: KITCHEN
Characters: HARI, ANMOL
Content: [scene text]
...
```

**Streaming:** Anthropic async streaming → yield each text token → SSE `event: token`

**Citation strategy:**
- Citations extracted from chunks BEFORE streaming begins
- Emitted as `event: citation` before first `event: token`
- Frontend displays citations as pills, then streams text answer

## Why This Architecture?

| Decision | Reason |
|----------|--------|
| Scene-level chunks | Citation accuracy — "Scene 14, Page 42" |
| 3072-dim embeddings | Better multilingual/Malayalam semantic capture |
| Pre-streaming citations | User sees sources before reading the answer |
| Cohere reranking | Pinecone cosine similarity ≠ semantic relevance |
| Malayalam query expansion | Bridges ML query → EN screenplay content |
| Claude Sonnet | Best Malayalam comprehension among frontier models |

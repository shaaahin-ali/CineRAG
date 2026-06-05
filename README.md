# CinePhile 🎬 — Malayalam Edition

> AI-powered RAG platform for Mollywood film crews. Upload a screenplay, query it in Malayalam or English, get streaming answers with scene citations.

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black)](https://vercel.com)
[![Backend](https://img.shields.io/badge/Backend-Render-blue)](https://render.com)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)

---

## ✨ Features

- 📄 **Upload screenplays** — PDF, DOCX, TXT
- 🔍 **Natural language queries** — Malayalam or English
- ⚡ **Streaming responses** — Real-time via SSE
- 📌 **Scene citations** — Exact Scene #, Page #, Characters
- 🎭 **Multi-role access** — Producer, Director, Actor, Cinematographer, Editor, Music
- 🌐 **Bilingual UI** — മലയാളം + English
- 💾 **Query history & bookmarks**
- 🎬 **Malayalam cultural intelligence** — Emotion detection, cultural context

## 🏗️ Architecture

```
Screenplay (PDF) → PyMuPDF Parse → Scene-aware Chunks
                                 → OpenAI 3-large Embeddings (3072 dims)
                                 → Pinecone Vector Store
                                 
Query (ML/EN) → langdetect → Indic-NLP Expansion → Embed
                           → Pinecone Search → Cohere Rerank
                           → Claude Sonnet 4 Stream (SSE)
                           → Scene Citations
```

## 🚀 Quick Start

### Prerequisites
- Node 18+
- Python 3.11+
- API keys (see `.env.example`)

### Backend
```bash
cd apps/backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp .env.example .env.local
# Fill in your API keys
uvicorn main:app --reload
# → http://localhost:8000/docs
```

### Frontend
```bash
cd apps/frontend
npm install
cp .env.example .env.local
# Fill in your API keys
npm run dev
# → http://localhost:3000
```

## 🔑 Environment Variables

See `apps/backend/.env.example` and `apps/frontend/.env.example`.

Required services:
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Supabase | DB + Auth + Storage | 500MB / 1GB |
| Pinecone | Vector DB (3072 dim) | 100K vectors |
| OpenAI | Embeddings (3-large) | Pay-per-use |
| Anthropic | Claude Sonnet streaming | Pay-per-use |
| Cohere | Reranking | 1K calls/month |

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [RAG Pipeline](docs/RAG_PIPELINE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY.md)

## 🎬 Demo Queries

**Malayalam:**
- `എന്റെ കഥാപാത്രത്തിന്റെ വികാസം വിവരിക്കുക` — Describe my character's arc
- `കുടുംബ സംഘർഷത്തിന്റെ ശിഖരം കാണിക്കുക` — Show the family conflict climax
- `മഴകാലത്തിലെ കാണുകൾ കാണിക്കുക` — Show monsoon scenes

**English:**
- "What is the emotional journey of the protagonist?"
- "Show all exterior night scenes"
- "Where does the climax occur?"

## 📜 License

MIT

# Security Policy

## Reporting Vulnerabilities

Please **do not** file public GitHub issues for security vulnerabilities.

Email: **security@cinephile.ai** (or the repo owner directly)

We will respond within 72 hours. Responsible disclosure is greatly appreciated.

---

## Security Architecture

### Authentication
- **Supabase Auth** handles all user identity (email/password + JWT)
- JWTs expire after **30 days** and are refreshed automatically
- Service Role key is **never exposed** to the frontend
- All backend routes validate the Supabase JWT before executing

### Authorization
- **Row-Level Security (RLS)** enforced in Supabase on all tables
- Users can only read/write their own projects and queries
- Project members can only access projects they were invited to
- Owners have full CRUD; members have role-based read access

### API Security
- **SlowAPI rate limiting**: 60 requests/minute per IP on all query endpoints
- **CORS** restricted to known frontend origins only
- Input sanitization on all text fields (null bytes stripped, length capped)
- File upload: allowed MIME types allowlisted, 50MB hard limit
- No `eval()` or `exec()` used anywhere in the codebase

### Secrets Management
- All secrets stored as **environment variables** (never in code)
- `.env` files are in `.gitignore`
- CI/CD uses **GitHub Secrets** — never plaintext values in workflow files
- Pinecone API key is backend-only (never in NEXT_PUBLIC_ variables)
- `SUPABASE_SERVICE_ROLE_KEY` is backend-only — the frontend uses the anon key only

### Vector Store Security
- Pinecone filter enforces `project_id` match on every query
- Users cannot access vectors from projects they don't own or belong to
- Vectors are deleted when a project is deleted

### Data Privacy
- Screenplay content is stored in **Supabase private Storage** (not public)
- File URLs are only returned to authenticated project members
- Query history is only visible to the user who ran the query (RLS enforced)

### Frontend Security
- Next.js middleware protects all `/dashboard` and `/query` routes
- Authentication state validated server-side in middleware (JWT check)
- No sensitive data in `localStorage` or `sessionStorage` — Supabase uses `httpOnly` cookies

---

## Dependencies

We use Dependabot (configured via `.github/dependabot.yml`) to keep dependencies updated.
Known vulnerability alerts are reviewed weekly.

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/apps/frontend"
    schedule:
      interval: "weekly"
  - package-ecosystem: "pip"
    directory: "/apps/backend"
    schedule:
      interval: "weekly"
```

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | ✅        |
| Others  | ❌        |

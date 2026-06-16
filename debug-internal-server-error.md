# Debug Session: internal-server-error

Status: OPEN

## Symptom
- User reports an internal server error.

## Scope
- App runtime issue not yet localized to frontend or backend.

## Initial Hypotheses
- H1: A frontend request is hitting an invalid or missing API/base URL and the server returns 500.
- H2: `next-auth` or auth route configuration is failing at runtime because required env vars are missing or malformed.
- H3: The backend API is throwing an exception on a route used by the UI due to request shape or missing configuration.
- H4: A server-side render path is calling code that assumes browser/session state exists and crashes on the server.
- H5: A recent UI integration introduced a request path or payload mismatch that triggers a downstream 500.

## Evidence Log
- Pending.

## Next Step
- Reproduce the error and collect runtime evidence before changing business logic.

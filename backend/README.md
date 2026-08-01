# MySaas Backend

Express backend API for the AdviceConnect lead-capture MVP.

## Current Host

| Field | Value |
| --- | --- |
| VM | Private backend services VM |
| Network | Private backend bridge |
| Exposure | Private only |

## Backend Rules

- Listen on backend/private interfaces only.
- Local development defaults to `127.0.0.1`.
- Prefer private backend-network addresses.
- Allow only required ports from Azure or frontend servers.
- Provide health endpoints for every service.
- Keep secrets out of git and out of READMEs.
- Do not log lead payloads or customer PII.
- Keep `GET /api/leads` disabled by default and always disabled in production.

## Local MVP API

| Route | Purpose |
| --- | --- |
| `GET /health` | Returns `{ "status": "ok", "service": "adviceconnect-backend" }` |
| `POST /api/leads` | Validates and stores a synthetic/local lead |
| `GET /api/leads` | Development-only lead listing when `ENABLE_DEV_LEAD_LIST=true` and not production |

## Local Commands

```bash
npm --workspace backend run build
npm --workspace backend test
npm --workspace backend run dev
```

## Environment

See `backend/.env.example`.

Safe defaults bind to `127.0.0.1`, store SQLite under `./data/`, use a `64kb` body limit, and keep lead listing disabled unless explicitly enabled outside production.

## Add A Backend Service

1. Pick a service name and port.
2. Deploy on VM `107` or create a new backend VM on `vmbr60`.
3. Add a persistent route back to Azure through the dedicated VPN connector.
4. Add a systemd service.
5. Verify from the backend VM:

```bash
curl -fsS http://127.0.0.1:<port>/health
```

6. Verify from Azure through the approved restricted access path.
7. Update this README with the new service.

## Backend Service Registry

| Service | Host | Port | Health Check | Status |
| --- | --- | --- | --- | --- |
| AdviceConnect API | Local development | `4000` | `http://127.0.0.1:4000/health` | Implemented locally |

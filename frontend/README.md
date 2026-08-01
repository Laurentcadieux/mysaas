# MySaas Frontend

React + Vite frontend for the AdviceConnect lead-capture MVP.

## Current Host

| Field | Value |
| --- | --- |
| VM | Local frontend web VM |
| Current service | `uipath-local-web.service` |
| Current app path | `/opt/uipath-local-web` |
| Public route | Azure HTTPS proxy |

The existing app is a hello-world React/Node service. MySaas can replace it or run beside it under a new path/port.

## Frontend Requirements

- Serve over HTTPS through Azure.
- Keep direct local VM exposure closed.
- Provide a `/health` endpoint.
- Document the service name, port, build command, and deployment directory.
- Use same-origin `/api` by default.
- Do not embed private backend VM IPs in browser code.

## Local MVP App

- Lead-capture form for name, email, business challenge, consent, and optional qualification fields.
- Success, validation, backend-failure, and duplicate-submit handling.
- Static `/health` file returning `{ "status": "ok", "service": "adviceconnect-frontend" }`.

## Local Commands

```bash
npm --workspace frontend run build
npm --workspace frontend test
npm --workspace frontend run dev
```

## Environment

See `frontend/.env.example`.

Leave `VITE_API_BASE_URL` empty for same-origin `/api`. Use `VITE_BACKEND_PROXY_TARGET=http://127.0.0.1:4000` for local Vite proxying.

## Add A New Frontend Service

1. Pick a port, for example `3100`.
2. Deploy the frontend on VM `106` or a new web VM.
3. Add a systemd service.
4. Verify locally:

```bash
curl -fsS http://127.0.0.1:3100/health
curl -fsS http://<private-web-host>:3100/health
```

5. Update Azure nginx to proxy the new path or hostname.
6. Verify publicly with HTTPS.

## Documentation Required Per Frontend

- Service name.
- Port.
- App path.
- Build command.
- Health check URL.
- Azure route or hostname.

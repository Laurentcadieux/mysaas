# MySaas Ops

## Baseline Checks

Keep public repository docs environment-neutral. Exact hostnames, SSH users, key paths, and IP addresses belong in restricted local operations notes.

Baseline check categories:

- Public HTTPS health.
- Azure proxy to local frontend over VPN.
- VPN gateway service status.
- Frontend service health.

## Add A Public Route

1. Confirm the backend target host and port from restricted ops inventory.
2. SSH to the Azure proxy VM using the approved local access path.
3. Edit nginx config.
4. Run:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

5. Verify through HTTPS.
6. Document the route in `frontend/README.md` or `backend/README.md`.

## Add A New VM

Use the detailed guide from the infrastructure project, then add the new VM to the relevant restricted inventory and summarize its application role here.

## Project Closure Note

The previous infrastructure project is considered handed off and published to:

```text
https://github.com/Laurentcadieux/azure-dmz-proxmox-backend-vnet
```

MySaas starts from that infrastructure state.

## Local MVP Ports

| Service | Port | Notes |
| --- | --- | --- |
| Backend API | `127.0.0.1:4000` | Default local backend |
| Frontend dev | `127.0.0.1:5173` | Default Vite dev server |
| E2E backend | `127.0.0.1:4100` | Isolated Playwright backend |
| E2E frontend | `127.0.0.1:4173` | Isolated Playwright frontend |

## Local Verification

```bash
npm ci
npm run build
npm test
npm run e2e
```

## Staging Deployment Prep

The first staging target is the existing Azure DMZ / Proxmox path documented in:

```text
/home/work10/.openclaw/workspace/proxmox/azure-dmz-proxmox-backend-vnet/
```

Use [deploy-runbook.md](deploy-runbook.md) for the MySaas-specific application deployment steps only.

Repository-safe templates:

- `backend.env.example` - backend production environment shape.
- `frontend.env.example` - frontend production environment shape.
- `systemd/adviceconnect-frontend.service.template` - frontend web service unit.
- `systemd/adviceconnect-backend.service.template` - backend service unit.

After staging DNS and routes are live, run:

```bash
STAGING_BASE_URL=https://staging.example.com npm run smoke:staging
```

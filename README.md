# MySaas

MySaas is the workspace for building AdviceConnect, a SaaS platform for conversational lead generation and advisory agents.

## Current Infrastructure Awareness

This project starts with these deployed servers already available:

| Role | Server | Addressing | Purpose |
| --- | --- | --- | --- |
| Public Azure entrypoint | Azure DMZ proxy | Public + private Azure addressing | HTTPS nginx proxy in Azure DMZ |
| Local frontend web server | Proxmox frontend VM | Local + private backend addressing | Current Node.js/React web host |
| Local backend services server | Proxmox backend VM | Private backend addressing | Private backend service host |
| Azure-to-local VPN server | Dedicated Linux VPN VM | Local + backend gateway addressing | strongSwan VPN gateway |

Public URL currently routed through this stack:

The public DNS and some existing resource names still contain legacy strings. Treat them as live infrastructure names, not product branding for MySaas. Keep exact operational inventory in restricted local notes.

## Target Product Direction

AdviceConnect will become a custom SaaS application with:

- A frontend served from the local web tier and published securely through Azure.
- Backend APIs/services hosted privately on the Proxmox backend network.
- Azure as the public DMZ and TLS termination point.
- Proxmox as the private workload zone.
- Site-to-site VPN as the private path between Azure and local backend servers.

See [docs/project-charter.md](docs/project-charter.md) for the full product charter.

## Project Layout

| Path | Purpose |
| --- | --- |
| `AGENTS.md` | Instructions for future agents working on MySaas |
| `package.json` | Root npm workspace and verification commands |
| `e2e/` | Playwright full-stack browser tests |
| `docs/project-charter.md` | AdviceConnect project charter and MVP scope |
| `docs/infrastructure-awareness.md` | Deployed Azure/Proxmox facts this project depends on |
| `docs/architecture.md` | Initial SaaS architecture |
| `frontend/` | React/Vite lead-capture frontend |
| `backend/` | Express API and SQLite MVP persistence |
| `ops/README.md` | Operational checks and deployment workflow |

## Current Code Slice

The first working product slice is local-only:

- React lead-capture form in `frontend/`.
- Express API in `backend/`.
- SQLite development persistence under `data/`.
- Playwright E2E tests under `e2e/`.

This pass does not deploy to Azure or Proxmox.

## Local Development

Use Node.js `22.13` or newer within the Node `22.x` line. The backend uses Node's built-in SQLite module.

```bash
npm ci
npm run build
npm test
npm run e2e
```

Backend defaults:

- `HOST=127.0.0.1`
- `PORT=4000`
- `DATABASE_PATH=./data/adviceconnect.sqlite`
- `CORS_ORIGIN=http://127.0.0.1:5173`
- `BODY_LIMIT=64kb`
- `ENABLE_DEV_LEAD_LIST=false`

Frontend defaults to same-origin `/api`. Use `VITE_BACKEND_PROXY_TARGET` for local Vite proxying. Browser code must not bake in private Proxmox backend IPs.

## Non-Negotiables

- Do not commit secrets.
- Do not expose local backend VMs directly to the internet.
- Keep Azure as the only public edge.
- Keep backend traffic on the private backend network.
- Use VM `108` as the Azure-to-local VPN connector unless a planned migration replaces it.
- Update the docs when adding a frontend route, backend service, VM, DNS name, port, or secret location.

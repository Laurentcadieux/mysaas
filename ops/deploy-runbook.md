# MySaas Staging Deployment Runbook

This runbook deploys the current MySaas application onto the existing Azure DMZ and Proxmox server path.

Infrastructure source of truth:

```text
/home/work10/.openclaw/workspace/proxmox/azure-dmz-proxmox-backend-vnet/
```

Use that project for Azure, VPN, Proxmox bridge, VM, route, certificate, and nginx details. This MySaas runbook owns only the application stack that runs on the already-built web and backend VMs.

## Target Shape

- Existing Azure DMZ nginx terminates public HTTPS and forwards to the existing local web VM.
- The local web VM runs the MySaas frontend service on port `3000`.
- The frontend service serves `frontend/dist` and proxies `/api/*` to the private backend service.
- The private backend VM runs the Express API on port `4000` under systemd.
- The backend persists staging leads under `/var/lib/adviceconnect`.
- The backend release lives under `/srv/adviceconnect/current`, preserving npm workspace dependency resolution.
- MySaas requires Node.js `22.13.x` or another Node `22.x` runtime compatible with `>=22.13 <23`.

## Build Artifacts

Run from the repository root:

```bash
npm ci
npm run build
```

The deployable outputs are:

- `frontend/dist/`
- `frontend/server.mjs`
- `frontend/package.json`
- `backend/dist/`
- root `package.json`
- `backend/package.json`
- `package-lock.json`

## Runtime Prerequisite

Check both application VMs before deployment:

```bash
node --version
npm --version
```

If Node is not in the supported `22.x` line, upgrade the application runtime before starting MySaas. The existing infrastructure docs may show an older runtime from the hello-world service; do not treat that as sufficient for this application.

## Backend VM Application Service

1. Create the application user and directories:

```bash
sudo useradd --system --home /srv/adviceconnect --shell /usr/sbin/nologin adviceconnect
sudo mkdir -p /srv/adviceconnect/releases /var/lib/adviceconnect /var/log/adviceconnect /etc/adviceconnect
sudo chown -R adviceconnect:adviceconnect /srv/adviceconnect /var/lib/adviceconnect /var/log/adviceconnect
```

2. Create a new release directory under `/srv/adviceconnect/releases/<release-id>` and copy:

- root `package.json`
- `package-lock.json`
- `backend/package.json`
- `backend/dist/`
- `frontend/package.json`
- `frontend/server.mjs`
- `frontend/dist/`

3. Point `/srv/adviceconnect/current` at the new release directory.

4. Install backend production dependencies from `/srv/adviceconnect/current`:

```bash
cd /srv/adviceconnect/current
npm ci --omit=dev --workspace backend
```

5. Create `/etc/adviceconnect/backend.env` from `ops/backend.env.example`, replacing the staging origin and database path if needed.

6. Install `ops/systemd/adviceconnect-backend.service.template` as `/etc/systemd/system/adviceconnect-backend.service`.

7. Start the backend:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now adviceconnect-backend
sudo systemctl status adviceconnect-backend
curl -fsS http://127.0.0.1:4000/health
```

## Frontend VM Application Service

1. Copy the same release directory to the frontend VM or publish an equivalent release under `/srv/adviceconnect/current`.

2. Create `/etc/adviceconnect/frontend.env` from `ops/frontend.env.example`, replacing `API_PROXY_TARGET` if the backend service target changes.

3. Install `ops/systemd/adviceconnect-frontend.service.template` as `/etc/systemd/system/adviceconnect-frontend.service`.

4. Start the frontend:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now adviceconnect-frontend
sudo systemctl status adviceconnect-frontend
curl -fsS http://127.0.0.1:3000/health
curl -fsS http://127.0.0.1:3000/api/health
```

## Existing Azure DMZ Route

Use the infrastructure project to confirm or update the existing Azure DMZ route. MySaas expects the public HTTPS route to reach the frontend service on port `3000`.

Do not duplicate Azure route details here. The current authoritative guide is:

```text
proxmox/azure-dmz-proxmox-backend-vnet/user-manual/README.md
```

## Staging Smoke Test

Run from the repository root after DNS and routes are active:

```bash
STAGING_BASE_URL=https://staging.example.com npm run smoke:staging
```

Expected checks:

- Frontend `/health` returns success.
- Backend `/api/health` returns success through the frontend route.
- `/api/leads` accepts a consented smoke lead and returns `201`.

Smoke submissions use an `example.invalid` email address so they are easy to filter from staging data.

## Rollback

1. Keep the previous `/srv/adviceconnect/frontend/dist` and `/srv/adviceconnect/releases/<release-id>` directories until smoke checks pass.
2. If smoke checks fail, restore the previous release directory symlinks or copied directories.
3. Restart the backend service and reload nginx.
4. Re-run the smoke test.

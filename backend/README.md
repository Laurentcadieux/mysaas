# MySaas Backend

## Current Host

| Field | Value |
| --- | --- |
| VM | `107` / `vm-prd-backend-services-001` |
| Backend IP | `10.60.0.20` |
| Network | `vmbr60` |
| Exposure | Private only |

## Backend Rules

- Listen on backend/private interfaces only.
- Prefer `10.60.0.0/24` addresses.
- Allow only required ports from Azure or frontend servers.
- Provide health endpoints for every service.
- Keep secrets out of git and out of READMEs.

## Add A Backend Service

1. Pick a service name and port.
2. Deploy on VM `107` or create a new backend VM on `vmbr60`.
3. Add a persistent route back to Azure:

```text
10.50.0.0/16 via 10.60.0.1
```

4. Add a systemd service.
5. Verify from the backend VM:

```bash
curl -fsS http://127.0.0.1:<port>/health
```

6. Verify from Azure:

```bash
ssh -i /home/work10/.ssh/openclaw_azure_dmz_ed25519 azureadmin@20.220.251.71 \
  'curl -fsS http://10.60.0.20:<port>/health'
```

7. Update this README with the new service.

## Backend Service Registry

| Service | Host | Port | Health Check | Status |
| --- | --- | --- | --- | --- |
| Placeholder | VM `107` | TBD | TBD | Reserved |

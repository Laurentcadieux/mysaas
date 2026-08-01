# MySaas Frontend

## Current Host

| Field | Value |
| --- | --- |
| VM | `106` / `vm-prd-web-001` |
| LAN IP | `192.168.0.192` |
| Backend IP | `10.60.0.10` |
| Current service | `uipath-local-web.service` |
| Current app path | `/opt/uipath-local-web` |
| Public URL | `https://uipath-local-web-canada.canadacentral.cloudapp.azure.com/` |

The existing app is a hello-world React/Node service. MySaas can replace it or run beside it under a new path/port.

## Frontend Requirements

- Serve over HTTPS through Azure.
- Keep direct local VM exposure closed.
- Provide a `/health` endpoint.
- Document the service name, port, build command, and deployment directory.

## Add A New Frontend Service

1. Pick a port, for example `3100`.
2. Deploy the frontend on VM `106` or a new web VM.
3. Add a systemd service.
4. Verify locally:

```bash
curl -fsS http://127.0.0.1:3100/health
curl -fsS http://10.60.0.10:3100/health
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

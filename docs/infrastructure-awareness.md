# Infrastructure Awareness

The infrastructure source of truth for MySaas is:

```text
/home/work10/.openclaw/workspace/proxmox/azure-dmz-proxmox-backend-vnet/
```

Use that project for Azure, Proxmox, VPN, DNS, certificates, VM IDs, IP addresses, routes, and infrastructure health checks. Do not duplicate those values here; duplication creates drift.

## MySaas Application Assumptions

- The public HTTPS route is owned by the existing Azure DMZ path.
- MySaas frontend runs as an application service on the existing local web VM.
- MySaas backend runs as a private application service on the existing backend VM.
- The frontend service proxies same-origin `/api/*` to the backend service.
- The backend service is not directly internet-exposed.
- MySaas requires Node.js `22.13.x` or another supported Node `22.x` runtime.

## Secret Handling

Project secrets are not committed. Keep exact secret paths and access commands in local restricted notes only.

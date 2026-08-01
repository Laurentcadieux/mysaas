# MySaas

MySaas is the new SaaS project that will use the existing Azure DMZ and Proxmox backend infrastructure.

## Current Infrastructure Awareness

This project starts with these deployed servers already available:

| Role | Server | Addressing | Purpose |
| --- | --- | --- | --- |
| Public Azure entrypoint | `vm-dmz-web-proxy-001` | public `20.220.251.71`, private `10.50.10.4` | HTTPS nginx proxy in Azure DMZ |
| Local frontend web server | VM `106` / `vm-prd-web-001` | LAN `192.168.0.192`, backend `10.60.0.10` | Current Node.js/React web host |
| Local backend services server | VM `107` / `vm-prd-backend-services-001` | backend `10.60.0.20` | Private backend service host |
| Azure-to-local VPN server | VM `108` / `vm-prd-vpn-gateway-001` | LAN `192.168.0.185`, backend gateway `10.60.0.1` | Linux strongSwan VPN gateway |

Public URL currently routed through this stack:

```text
https://uipath-local-web-canada.canadacentral.cloudapp.azure.com/
```

The public DNS and some existing resource names still contain legacy strings. Treat them as live infrastructure names, not product branding for MySaas.

## Target Product Direction

MySaas will become a custom SaaS application with:

- A frontend served from the local web tier and published securely through Azure.
- Backend APIs/services hosted privately on the Proxmox backend network.
- Azure as the public DMZ and TLS termination point.
- Proxmox as the private workload zone.
- Site-to-site VPN as the private path between Azure and local backend servers.

## Project Layout

| Path | Purpose |
| --- | --- |
| `AGENTS.md` | Instructions for future agents working on MySaas |
| `docs/infrastructure-awareness.md` | Deployed Azure/Proxmox facts this project depends on |
| `docs/architecture.md` | Initial SaaS architecture |
| `frontend/README.md` | Frontend plan and deployment notes |
| `backend/README.md` | Backend plan and deployment notes |
| `ops/README.md` | Operational checks and deployment workflow |

## Non-Negotiables

- Do not commit secrets.
- Do not expose local backend VMs directly to the internet.
- Keep Azure as the only public edge.
- Keep backend traffic on `10.60.0.0/24`.
- Use VM `108` as the Azure-to-local VPN connector unless a planned migration replaces it.
- Update the docs when adding a frontend route, backend service, VM, DNS name, port, or secret location.

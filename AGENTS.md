# AGENTS.md - MySaas

You are working in the MySaas project.

## Project Context

MySaas is the workspace for building AdviceConnect, a custom SaaS application that will run on the existing hybrid Azure and Proxmox environment.

Read `docs/project-charter.md` before making product decisions. It defines the AdviceConnect brand, MVP scope, roles, data model, pricing direction, and delivery phases.

The infrastructure already exists:

- Azure public DMZ proxy: `vm-dmz-web-proxy-001`
- Azure public IP: `20.220.251.71`
- Azure proxy private IP: `10.50.10.4`
- Local frontend VM: `106` / `vm-prd-web-001` / `10.60.0.10`
- Local backend VM: `107` / `vm-prd-backend-services-001` / `10.60.0.20`
- Local VPN VM: `108` / `vm-prd-vpn-gateway-001` / `10.60.0.1`
- Backend bridge: `vmbr60` / `10.60.0.0/24`
- Azure VNet: `10.50.0.0/16`

## Operating Rules

- Read `docs/infrastructure-awareness.md` before changing deployment assumptions.
- Use Azure as the public HTTPS entrypoint.
- Use Proxmox VMs for private workloads.
- Keep secrets out of git.
- Do not rename live infrastructure resources casually.
- Any new public route must be documented in `ops/README.md`.
- Any new backend service must be documented in `backend/README.md`.
- Any new frontend deployment must be documented in `frontend/README.md`.

## Current Active Path

```text
Internet HTTPS
  -> Azure nginx proxy
  -> Azure VPN Gateway
  -> local VPN VM 108
  -> vmbr60
  -> local frontend/backend VMs
```

## Verification Baseline

Use these checks before and after infrastructure-aware changes:

```bash
curl -fsS https://uipath-local-web-canada.canadacentral.cloudapp.azure.com/health

ssh -i /home/work10/.ssh/openclaw_proxmox_ed25519 ubuntu@192.168.0.185 \
  'systemctl is-active uipath-azure-vpn.service; sudo ipsec statusall'
```

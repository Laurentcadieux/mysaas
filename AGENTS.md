# AGENTS.md - MySaas

You are working in the MySaas project.

## Project Context

MySaas is the workspace for building AdviceConnect, a custom SaaS application that will run on the existing hybrid Azure and Proxmox environment.

Read `docs/project-charter.md` before making product decisions. It defines the AdviceConnect brand, MVP scope, roles, data model, pricing direction, and delivery phases.

The infrastructure already exists:

- Azure public DMZ proxy and TLS edge.
- Local frontend VM on Proxmox.
- Local backend services VM on the private backend network.
- Dedicated local Linux VPN VM connecting Azure to the private backend network.
- Private backend bridge for application traffic.

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

Use local verification for code changes. Infrastructure verification commands and exact hosts belong in restricted local operations notes.

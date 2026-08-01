# Infrastructure Awareness

This file is the repository-safe source of truth for how MySaas sees the existing infrastructure.

Exact IPs, SSH paths, and secret locations belong in restricted local operations notes, not public application docs.

## Azure

- Azure is the public DMZ and TLS termination layer.
- The public proxy forwards approved application routes over the private Azure-to-local path.
- Resource names may include legacy operational strings and should not be renamed casually.

## Proxmox

- Proxmox hosts the private frontend and backend workload VMs.
- Backend services stay on the private backend bridge.
- A dedicated Linux VPN VM owns the local VPN gateway role.

## Local Servers

- Frontend web host: local Proxmox VM, reached publicly only through Azure.
- Backend services host: private Proxmox VM, not directly internet-exposed.
- VPN connector: dedicated local Linux VM running strongSwan.

## Active Routing

Azure DMZ routes to the local backend network through the site-to-site VPN. Local application VMs route Azure-bound traffic through the dedicated VPN connector.

## Important Names

Some existing resource names include legacy text. These names are operational identifiers. Do not change them until a specific rename/migration task is planned.

## Secret Handling

Project secrets are not committed. Keep exact secret paths and access commands in local restricted notes only.

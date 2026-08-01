# Infrastructure Awareness

This file is the source of truth for how MySaas sees the existing infrastructure.

## Azure

| Item | Value |
| --- | --- |
| Resource group | `Canada-rg` |
| Region | `canadacentral` |
| VNet | `vnet-uipath-azure-prod` |
| VNet CIDR | `10.50.0.0/16` |
| DMZ subnet | `snet-dmz-web` / `10.50.10.0/24` |
| App subnet | `snet-dmz-app` / `10.50.20.0/24` |
| Gateway subnet | `GatewaySubnet` / `10.50.255.0/27` |
| Public proxy VM | `vm-dmz-web-proxy-001` |
| Public proxy IP | `20.220.251.71` |
| Public proxy private IP | `10.50.10.4` |
| Public DNS | `uipath-local-web-canada.canadacentral.cloudapp.azure.com` |
| VPN gateway | `vpngw-uipath-prod` |
| VPN gateway public IP | `52.237.60.44` |

## Proxmox

| Item | Value |
| --- | --- |
| Node 1 | `hyper100` / `192.168.0.100` |
| Node 2 | `hyper101` / `192.168.0.101` |
| Management LAN | `192.168.0.0/24` |
| Backend bridge | `vmbr60` |
| Backend CIDR | `10.60.0.0/24` |
| Backend gateway | `10.60.0.1` on VM `108` |

## Local Servers

| Role | Server | IPs | Notes |
| --- | --- | --- | --- |
| Frontend | VM `106` / `vm-prd-web-001` | `192.168.0.192`, `10.60.0.10` | Current Node.js/React host |
| Backend | VM `107` / `vm-prd-backend-services-001` | `10.60.0.20` | Private backend host |
| VPN | VM `108` / `vm-prd-vpn-gateway-001` | `192.168.0.185`, `10.60.0.1` | strongSwan gateway |

## Active Routing

```text
Azure 10.50.0.0/16 <-> local backend 10.60.0.0/24
```

VM `106` has a route back to Azure:

```text
10.50.0.0/16 via 10.60.0.1 dev eth1
```

## Important Names

Some existing resource names include legacy text. These names are operational identifiers. Do not change them until a specific rename/migration task is planned.

## Secret Locations

Project secrets are not committed. Existing local secret values live in:

```text
/home/work10/.openclaw/workspace/proxmox/azure-dmz-proxmox-backend-vnet/secrets.env
```

This file is git-ignored and mode `600`.

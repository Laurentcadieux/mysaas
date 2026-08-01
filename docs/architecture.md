# MySaas Architecture

## Initial Shape

AdviceConnect will use a split public/private model:

- Azure handles public TLS, DNS, and ingress.
- Proxmox hosts the SaaS frontend and backend workloads.
- A dedicated Linux VPN VM connects Azure to the local backend network.

## Request Flow

```text
Browser
  -> HTTPS to Azure nginx proxy
  -> private proxy over VPN
  -> frontend service on VM 106
  -> backend services on VM 107 or future backend VMs
```

## Frontend

The current frontend host is the dedicated local frontend VM on the private backend network.

For the first MySaas iteration, deploy the SaaS frontend there or create a new frontend VM on:

- the local admin/LAN bridge for management access.
- the private backend bridge for Azure/backend access.

## Backend

The current backend host is the dedicated local backend services VM.

Backend services should listen only on private backend IPs and be reachable through:

- local frontend VM(s),
- Azure DMZ/app subnet over VPN,
- explicitly allowed ports only.

## Ingress

The Azure DMZ proxy currently terminates HTTPS and proxies to the local frontend service over the VPN.

Future options:

- Path-based routing, for example `/api` to backend APIs.
- Hostname-based routing, after a custom domain is available.
- Replace nginx VM with Application Gateway WAF if the product needs managed L7 WAF features.

## Deployment Principle

Keep MySaas product code separate from infrastructure documentation, but keep infrastructure awareness close enough that future agents do not accidentally expose local services or bypass the VPN.

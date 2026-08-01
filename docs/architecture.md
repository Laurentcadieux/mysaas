# MySaas Architecture

## Initial Shape

MySaas will use a split public/private model:

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

The current frontend host is VM `106` at `10.60.0.10`.

For the first MySaas iteration, deploy the SaaS frontend there or create a new frontend VM on:

- `vmbr0` for admin/LAN access.
- `vmbr60` for private Azure/backend access.

## Backend

The current backend host is VM `107` at `10.60.0.20`.

Backend services should listen only on private backend IPs and be reachable through:

- local frontend VM(s),
- Azure DMZ/app subnet over VPN,
- explicitly allowed ports only.

## Ingress

The Azure DMZ proxy currently terminates HTTPS and proxies to `10.60.0.10:3000`.

Future options:

- Path-based routing, for example `/api` to backend APIs.
- Hostname-based routing, after a custom domain is available.
- Replace nginx VM with Application Gateway WAF if the product needs managed L7 WAF features.

## Deployment Principle

Keep MySaas product code separate from infrastructure documentation, but keep infrastructure awareness close enough that future agents do not accidentally expose local services or bypass the VPN.

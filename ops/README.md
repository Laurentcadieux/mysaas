# MySaas Ops

## Baseline Checks

Public HTTPS:

```bash
curl -fsS https://uipath-local-web-canada.canadacentral.cloudapp.azure.com/health
```

Azure proxy to local frontend over VPN:

```bash
ssh -i /home/work10/.ssh/openclaw_azure_dmz_ed25519 azureadmin@20.220.251.71 \
  'curl -fsS http://10.60.0.10:3000/health'
```

VPN gateway:

```bash
ssh -i /home/work10/.ssh/openclaw_proxmox_ed25519 ubuntu@192.168.0.185 \
  'systemctl is-active strongswan-starter.service; systemctl is-active uipath-azure-vpn.service; sudo ipsec statusall'
```

Frontend service:

```bash
ssh -i /home/work10/.ssh/openclaw_proxmox_ed25519 ubuntu@192.168.0.192 \
  'systemctl is-active uipath-local-web.service; curl -fsS http://127.0.0.1:3000/health'
```

## Add A Public Route

1. Confirm the backend target IP and port.
2. SSH to the Azure proxy VM.
3. Edit nginx config.
4. Run:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

5. Verify through HTTPS.
6. Document the route in `frontend/README.md` or `backend/README.md`.

## Add A New VM

Use the detailed guide in the previous project:

```text
../proxmox/azure-dmz-proxmox-backend-vnet/user-manual/README.md
```

Then add the new VM to the relevant MySaas README.

## Project Closure Note

The previous infrastructure project is considered handed off and published to:

```text
https://github.com/Laurentcadieux/azure-dmz-proxmox-backend-vnet
```

MySaas starts from that infrastructure state.

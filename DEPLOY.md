# Publishing Antrello Editores at antrello.com.br

The app is served publicly at **https://antrello.com.br**, for **free**, with
multi-GB video upload/download and **no router configuration**.

## How it works

```
Browser ── https://antrello.com.br ──▶ Cloudflare edge (TLS)
        ──▶ Cloudflare Tunnel (outbound-only connection from this machine)
        ──▶ cloudflared (host systemd service) ──▶ localhost:3000 (the app container)
```

`cloudflared` dials *out* to Cloudflare and holds the connection open, so there
are no inbound ports and no port-forwarding — the Vivo router is bypassed
entirely. Cloudflare provides HTTPS at the edge for free.

**The 100 MB catch, handled in code:** tunnel traffic passes through
Cloudflare's proxy, which caps request bodies at 100 MB on the free plan. So the
uploader sends videos in **<100 MB chunks** (`CHUNK_SIZE` in
`src/components/UploadDropzone.tsx`) that the server reassembles (`saveChunk` in
`src/lib/storage.ts`, used by both upload routes). Downloads have no such cap.
Multi-GB works in both directions.

## The moving parts (already set up)

| Piece | Where | Notes |
| ----- | ----- | ----- |
| App | `docker compose` service `app`, published on `localhost:3000` | Rebuild/restart with `./restart.sh` |
| Tunnel | host systemd service `cloudflared` | config: `/etc/cloudflared/config.yml` |
| Tunnel ID | `73c468d2-b6e0-46da-a929-c5ff2c979ae7` (name `antrello`) | credentials in `/etc/cloudflared/` |
| DNS | Cloudflare zone `antrello.com.br` | `antrello.com.br` + `www` are **proxied CNAMEs** → `<tunnel-id>.cfargotunnel.com` |

The tunnel is a **locally-configured** tunnel (config file, not the Zero Trust
dashboard). If the dashboard offers to "migrate" it — **don't**; it's managed
here via `/etc/cloudflared/config.yml`.

## Everyday operations

**Deploy app changes:**
```bash
./restart.sh                       # rebuild image + restart the app container
```
The tunnel keeps running independently; it just proxies to `localhost:3000`.

**Tunnel status / logs:**
```bash
systemctl status cloudflared
journalctl -u cloudflared -f
```

**Change what the tunnel serves** (e.g. add a hostname): edit
`/etc/cloudflared/config.yml` under `ingress:`, then:
```bash
systemctl restart cloudflared
```
A backup of the original single-hostname config is at
`/etc/cloudflared/config.yml.bak`.

## Troubleshooting

- **502 / "can't reach origin"** → app container is down. `docker compose ps`,
  then `./restart.sh`.
- **Upload fails on large files** → confirm you're on the chunked build
  (`git log`/rebuild); each chunk must be < 100 MB.
- **Site unreachable, tunnel logs show connection errors** →
  `systemctl restart cloudflared`.
- **DNS check:** `dig +short antrello.com.br` should return Cloudflare edge IPs
  (`104.x` / `172.67.x`), *not* a home IP. If it shows a home IP, the record
  reverted to an `A` record — it must be a **proxied CNAME** to the tunnel.
- **Home IP is dynamic** — irrelevant; the tunnel is outbound so the IP can
  change freely.

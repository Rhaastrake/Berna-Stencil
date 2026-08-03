# Nginx

`nginx.conf` in the project root is a **ready-to-use site file** for a Nibula
site on your own server (a VPS). Replace three placeholders, symlink it, reload.

It targets the **Node** backend; see *Using the PHP backend* below for PHP.

## Setup

| Placeholder | Value |
|---|---|
| `YOUR_DOMAIN` | your domain — appears twice (port 80 and 443) |
| `SITE_FOLDER` | document root under `/var/www/` — your uploaded `out` folder |
| `YOUR_CERTIFICATE` | dir name under `/etc/letsencrypt/live/` — **not always equal to the domain**: a cert may be issued for a different hostname (common with DDNS) or cover several domains. Check with `sudo certbot certificates` |

```bash
sudo cp nginx.conf /etc/nginx/sites-available/my-site
sudo nano /etc/nginx/sites-available/my-site        # replace the placeholders
sudo ln -s /etc/nginx/sites-available/my-site /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Verify:

```bash
curl -I http://YOUR_DOMAIN/                # 301 to https
curl -I https://YOUR_DOMAIN/               # 200
curl -I https://YOUR_DOMAIN/nonexistent    # 404, not 200 or 500
```

On RHEL/Alpine there is no `sites-available`; put the file in
`/etc/nginx/conf.d/` instead.

## Requirements

- A valid certificate covering `YOUR_DOMAIN`
- `404.html` present in the document root and readable by nginx
- Nginx ≥ 1.25 for `http2 on;` — on older versions use `listen 443 ssl http2;`

## What it provides

- HTTP → HTTPS redirect on port 80
- TLS via Let's Encrypt, with the Certbot SSL options included
- `server_tokens off` and `autoindex off`
- 403 / 404 → `/404.html`, preserving the original status code
- Backend source directory (`/backend/`) sealed with `return 404`
- `web.config`, dotfiles and `.php` blocked
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Strict-Transport-Security`
- `/api/*` reverse-proxied to the Node backend on `127.0.0.1:3000`

## Certificate renewal

The `/.well-known/acme-challenge/` block is only needed with the **webroot**
authenticator. If you obtained the certificate with `certbot --nginx`, remove it.
Check with:

```bash
grep authenticator /etc/letsencrypt/renewal/YOUR_DOMAIN.conf
```

When adding a domain to an existing certificate, always pass `--cert-name` **and
list every domain already covered** — omitted ones are dropped, and without the
flag Certbot creates a separate certificate instead of expanding.

## HSTS

The file ships with `max-age=300` deliberately. Browsers cache the HSTS policy
for the whole `max-age` **even after you remove the header**, so a long value
combined with a broken certificate locks visitors out with no way back.

Raise it to `31536000` once HTTPS is confirmed stable. Add `; includeSubDomains`
only if every current and future subdomain is served over HTTPS with a valid
certificate.

## WebSocket

Not enabled by default. If your backend uses socket.io or similar, add a map at
`http` level (e.g. `/etc/nginx/conf.d/websocket.conf`):

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

and inside `location ^~ /api/`:

```nginx
proxy_set_header Upgrade    $http_upgrade;
proxy_set_header Connection $connection_upgrade;
```

For long-lived connections also raise `proxy_read_timeout`, ideally in a
dedicated location for the socket path so normal API requests keep the 60s
default.

## Using the PHP backend

This file targets Node. `.php` requests return 404 by design: without a
`fastcgi_pass` block Nginx would serve them as plain text and leak source code,
database credentials included.

For a PHP deployment, replace the `.php` block with:

```nginx
location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.3-fpm.sock;
}
```

and change `try_files` in `location /` to `$uri $uri/ /index.php?$query_string`.

Check the socket path with `ls /run/php/`:

| Distro | Path |
|---|---|
| Debian / Ubuntu | `unix:/run/php/php8.3-fpm.sock` |
| RHEL / Fedora | `unix:/run/php-fpm/php-fpm.sock` |
| TCP fallback | `127.0.0.1:9000` |

## Troubleshooting

| Symptom | Cause |
|---|---|
| `cannot load certificate ... Permission denied` | `nginx -t` run without `sudo` — the certs are root-only |
| `no alternative certificate subject name matches` | the cert doesn't cover `YOUR_DOMAIN`; check `sudo certbot certificates` |
| 500 instead of the 404 page | `404.html` missing or unreadable by nginx |
| `unknown directive "http2"` | Nginx < 1.25 — use `listen 443 ssl http2;` |
| 502 on `/api/*` | the Node process isn't running; see `docs/Deploy.md` |
| Site not responding at all | symlink missing in `sites-enabled/`, or nginx not reloaded |
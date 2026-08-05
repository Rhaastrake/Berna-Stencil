# Deploy

Nibula builds a static site into `out`. Publishing means uploading that folder to
a web server. What you need depends on **where** you publish and **which
backend** you chose (see `docs/Backend.md`).

## The one constraint that decides everything

The two backends run in fundamentally different ways:

- **PHP** is executed **per request** by the web server through PHP-FPM. There is
  no process to keep alive — the server starts it, it answers, it exits.
- **Node** **is** the server: a long-running process listening on
  `127.0.0.1:3000`, which the web server reverse-proxies `/api` to. Something has
  to start it and keep it alive across reboots and crashes.

This is why **shared hosting cannot run the Node backend**. On Aruba, cPanel and
similar, you upload files into a web root — you have no shell to start a daemon,
no systemd, and any process you did manage to launch would be killed. If your
host is shared hosting, choose PHP. It is not a limitation of Nibula.

## Where you can publish

| Target | Frontend | PHP backend | Node backend |
|---|---|---|---|
| Shared hosting (Apache — Aruba, cPanel) | ✅ | ✅ | ❌ no persistent process |
| Windows hosting (IIS) | ✅ | ✅ FastCGI | ⚠️ needs ARR reverse proxy |
| Your own VPS (Nginx on Ubuntu) | ✅ | ✅ | ✅ |
| Static hosting (Netlify, Vercel, GitHub Pages) | ✅ | ❌ | ❌ |

Static hosting serves files and nothing else — fine if your site has no `/api`
endpoints, unusable otherwise.

## Requirements

**PHP backend:** a server with PHP support and Composer for the backend
dependencies.

**Node backend:** Node.js 18+ and shell access to run a persistent process — a
VPS you control.

---

## Shared hosting (Apache)

Upload the **contents of `out`** to the web root (often `htdocs`, `public_html`
or `www`). Done — `.htaccess` is already inside `out` and Apache reads it
automatically: directory listing off, 403/404 → `/404.html`, sensitive files
blocked, backend source sealed, `/api/*` routed.

**Backend routing:** if `mod_proxy` is available, `/api` is proxied to Node on
`127.0.0.1:3000`; if not — the usual case on shared hosting — `/api` is
rewritten to the PHP front controller. To force PHP on a proxy-enabled server,
comment the `mod_proxy` block in `.htaccess`.

## Windows hosting (IIS)

Same idea: upload the contents of `out`, `web.config` is already there and read
automatically.

**Backend routing:** `/api` is rewritten to the PHP front controller. To use the
Node backend instead, uncomment the `ApiToNode` rule in `web.config` and delete
`ApiToPhp` — this needs the ARR and URL Rewrite modules with proxying enabled,
so a server you control, not shared hosting.

> ⚠️ **If you chose the Node backend and your host has no ARR** (Aruba and other
> Windows shared hosting), don't upload the `backend` folder at all. The static
> site works, and `/api/*` answers with your `404.html`. Upload it and every
> `/api` request returns an empty 404 instead: IIS rewrites it onto the PHP
> front controller, which a Node project doesn't contain.

---

## Your own server (Nginx on a VPS)

Nginx doesn't read per-directory config files — the whole site lives in one file.
Nibula ships `nginx.conf` in the project root as a ready-to-use site file that
**covers both backends without edits**: `/api` goes to Node, and if Node is
unreachable the request falls through to PHP automatically.

Upload the contents of `out` to `/var/www/SITE_FOLDER`, then follow the steps
below.

### 1. Replace

| Placeholder | Where |
|---|---|
| `YOUR_DOMAIN` | `server_name`, twice (port 80 and 443) |
| `SITE_FOLDER` | document root under `/var/www/` |
| `YOUR_CERTIFICATE` | dir under `/etc/letsencrypt/live/` |
| `SITE_NAME` | file name in the commands below |

### 2. Install (skip if already present)

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

If you are using PHP as backend:

```bash
sudo apt install -y php-fpm
```

### 3. Certificate

```bash
sudo certbot certonly --nginx --cert-name SITE_NAME -d YOUR_DOMAIN
sudo systemctl enable --now certbot.timer      # auto-renew every 90 days
```

### 4. Install the site

```bash
# Move to nginx folders
cd /etc/nginx/sites-available

# Create and write a new file
sudo nano SITE_NAME
# CTRL + O, ENTER, CTRL + X

# Copy the config to sites-enabled
sudo cp SITE_NAME ../sites-enabled/

# Test and reload the nginx configuration
sudo nginx -t && sudo systemctl reload nginx
```

### If it fails

| Symptom | Cause |
|---|---|
| `cannot load certificate ... Permission denied` | `nginx -t` needs sudo |
| `cannot load certificate ... No such file` | wrong certificate name |
| `no alternative certificate subject name` | certificate doesn't cover domain |
| `unknown directive "http2"` | nginx < 1.25, check with `nginx -v` |
| NXDOMAIN / timeout during certbot | DNS not pointing here |
| 500 instead of the 404 page | `404.html` missing |
| 502 on `/api`, Node deployed | Node process not running |
| 502 on `/api`, PHP deployed | wrong php-fpm socket path |

---

## Starting the Node backend on the server

After uploading `out`:

1. Install the backend's runtime deps:
   ```bash
   cd /var/www/SITE_FOLDER/backend
   npm install
   ```

2. Make sure `config.js` exists in `out/backend/` (copy `example.config.js` if
   missing) and fill in your values.

3. Start it in a new screen:
   ```bash
   screen -S node-backend
   # In the new screen terminal:
   sudo node /var/www/SITE_FOLDER/backend/_core/index.js
   curl http://127.0.0.1:3000/api/example-public
   ```

4. Exit the screen without closing the process with `CTRL + A`, `D`. To resume
   the screen type `screen -r node-backend`.

5. For production use **systemd**, which also restarts on crash and reboot.
   Create `/etc/systemd/system/backend-node.service`:

   ```ini
   [Unit]
   Description=Nibula Node backend
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/SITE_FOLDER/backend
   ExecStart=/usr/bin/node /var/www/SITE_FOLDER/backend/_core/index.js
   Restart=always
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```

   Adjust `WorkingDirectory` and the `node` path (`which node`), then:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now backend-node
   sudo systemctl status backend-node
   ```

   (`pm2` works too: `pm2 start _core/index.js --name backend-node`.)

### Environment variables

Read by the Node backend at startup. Set them in the systemd unit with
`Environment=KEY=value`.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port Node listens on (must match the proxy target in `nginx.conf`) |
| `HOST` | `127.0.0.1` | Bind address — keep it local; the web server is the public face |
| `DOCUMENT_ROOT` | auto (`SITE_FOLDER/`) | Where `404.html` lives; detected as the folder above `backend/` |

Error verbosity is **not** an environment variable: it is the `APP_ENV` key in
`config.js` / `config.php`. See `docs/Backend.md`.
# Deploy

Nibula builds a static site into `out`. To publish it you upload that folder to a
web server. What you need depends on **where** you publish and **which backend**
you chose at scaffold time (PHP or Node.js — see `docs/Backend.md`).

## Prerequisites

**PHP backend:** a server with PHP support (Apache, Nginx + PHP-FPM, or IIS +
FastCGI) and Composer for the backend dependencies. Works on typical shared
hosting.

**Node backend:** Node.js 18+ and the ability to run a long-running process —
i.e. a VPS you control, not typical shared hosting. No PHP or Composer required.

---

## Shared hosting (Apache)

The most common option, and the natural home for the **PHP** backend — shared
hosting can't keep a Node process alive.

Upload the **contents of `out`** to the hosting's web root (often `htdocs`,
`public_html`, or `www`). Done. `.htaccess` is already inside `out` and Apache
reads it automatically: directory listing off, 403/404 → `/404.html`, sensitive
files blocked, backend source sealed, `/api/*` routed.

**Backend routing:** if `mod_proxy` is available, `/api` is reverse-proxied to
Node on `127.0.0.1:3000`; if not, `/api` is rewritten to the PHP front
controller. To force PHP on a proxy-enabled server, comment the `mod_proxy`
block in `.htaccess`.

## Windows hosting (IIS)

Same idea, different server. Upload the contents of `out`; `web.config` is
already there and read automatically.

**Backend routing:** the `ApiToNode` rewrite rule (requires the ARR + URL Rewrite
modules) reverse-proxies `/api` to Node and wins if present. Remove it to fall
back to `ApiToPhp`, which rewrites `/api` to the PHP front controller.

## Your own server (Nginx on a VPS)

The setup for the **Node** backend. Unlike Apache and IIS, Nginx doesn't read
per-directory config files — the whole site is defined in one file.

Nibula ships `nginx.conf` in the project root as a **ready-to-use site file**:
replace three placeholders, symlink it, reload.

```bash
sudo cp nginx.conf /etc/nginx/sites-available/my-site
sudo nano /etc/nginx/sites-available/my-site        # YOUR_DOMAIN, SITE_FOLDER, YOUR_CERTIFICATE
sudo ln -s /etc/nginx/sites-available/my-site /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Full reference, requirements and troubleshooting: **`docs/Nginx.md`**.

## Static hosting (Netlify, Vercel, GitHub Pages)

Frontend only. Neither backend runs there — no PHP, no persistent process. Fine
if your site has no `/api` endpoints.

---

## Starting the Node backend on the server

Unlike PHP, the Node backend is **not** executed by the web server per request —
it is a process you start and keep alive. After uploading your built `out` folder:

1. Install the backend's runtime deps (only needed if an endpoint uses the DB):
```bash
   cd /var/www/your-site/out/backend
   npm install
```

2. Make sure `config.js` exists in `out/backend/` (copy `example.config.js` to
   `config.js` if missing) and fill in your values.

3. Start it — quick test first:
```bash
   node _core/index.js
   # -> [backend-node] listening on http://127.0.0.1:3000 (env: production)
```
   Then, from the server, confirm it answers:
```bash
   curl http://127.0.0.1:3000/api/example-public
```

   > Running `node _core/index.js` directly ties the process to your SSH session —
   > close the terminal and the backend dies. To try it out without staying stuck
   > there, use **`screen`** (a detachable terminal):
   > ```bash
   > screen -S backend            # open a named session
   > node _core/index.js          # start the backend inside it
   > # press Ctrl+A then D to detach — the backend keeps running
   > # reattach later with:  screen -r backend
   > ```
   > `screen` is fine for testing. For production, prefer **systemd** (step 4).

4. To keep it running after logout, use **systemd**. An example unit ships at
   `backend/backend-node.service.example` — copy it to
   `/etc/systemd/system/backend-node.service`, adjust `WorkingDirectory` and the
   `node` path (`which node`), then:
```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now backend-node
   sudo systemctl status backend-node
```
   (`pm2` also works: `pm2 start _core/index.js --name backend-node`.)

The web server then reverse-proxies `/api` to this process. If Node is down the
proxy returns 502 — there is no automatic PHP fallback.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port Node listens on (match your proxy target) |
| `HOST` | `127.0.0.1` | Bind address (keep it local; the web server is the public face) |
| `APP_ENV` | `production` | `production` hides error details; anything else = verbose 500s |
| `DOCUMENT_ROOT` | auto (`out/`) | Where `404.html` lives; auto-detected as the folder above `backend/` |

---

## One config file, one backend

Each server config targets a specific backend, decided at setup time rather than
at runtime:

- **Apache:** `mod_proxy` present → Node; absent → PHP
- **IIS:** `ApiToNode` rule present (needs ARR) → Node; remove it for `ApiToPhp`
- **Nginx:** ships configured for Node; see `docs/Nginx.md` for PHP

Since a given deployment runs only one backend, this is a one-time setup.
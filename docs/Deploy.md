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

**Backend routing:** the `ApiToNode` rule (requires the ARR + URL Rewrite
modules) proxies `/api` to Node and wins if present. Remove it to fall through
to `ApiToPhp`, which rewrites `/api` to the PHP front controller.

## Your own server (Nginx on a VPS)

Nginx doesn't read per-directory config files — the whole site lives in one file.
Nibula ships `nginx.conf` in the project root as a ready-to-use site file that
**covers both backends without edits**: `/api` goes to Node, and if Node is
unreachable the request falls through to PHP automatically.

---

## Starting the Node backend on the server

After uploading `out`:

1. Install the backend's runtime deps:
   ```bash
   cd /var/www/backend/SITE_FOLDER
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
4. Exit the screen without closing the process with `CTRL + A`, `D`. To resume the screen type `screen -r node-backend`.

5. For production use **systemd**, which also restarts on crash and reboot. An
   example unit ships at `backend/backend-node.service.example` — copy it to
   `/etc/systemd/system/backend-node.service`, adjust `WorkingDirectory` and the
   `node` path (`which node`), then:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now backend-node
   sudo systemctl status backend-node
   ```
   (`pm2` works too: `pm2 start _core/index.js --name backend-node`.)

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port Node listens on (match your proxy target) |
| `HOST` | `127.0.0.1` | Bind address — keep it local; the web server is the public face |
| `APP_ENV` | `production` | `production` hides error details; anything else = verbose 500s |
| `DOCUMENT_ROOT` | auto (`SITE_FOLDER/`) | Where `404.html` lives; detected as the folder above `backend/` |
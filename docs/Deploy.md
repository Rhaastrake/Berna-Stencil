# Deploy

Nibula builds your finished site into a folder called `out`. Publishing means
copying that folder onto a web server so people can reach it.

How you do that depends on two things: **where** you are publishing, and **which
backend** you picked when you created the project (see `docs/Backend.md`).

## Start here

If you don't know which case you are in, answer this first:

**Did you choose the PHP backend or the Node backend?**

- **PHP** → almost anywhere works, including cheap hosting plans. Jump to
  *Shared hosting* or *Windows hosting*.
- **Node** → you need a server you control. Jump to *Your own server*.
- **No `/api` endpoints at all?** Your site is fully static. Anything works,
  including free hosting like Netlify or GitHub Pages.

## Why the backend decides everything

The two backends run in completely different ways, and this is the one thing
worth understanding before you pick a host.

**PHP** runs **once per visit**. A request arrives, the web server starts PHP,
PHP answers, PHP exits. Nothing stays running, so there is nothing to look after.

**Node is itself a server**. It is a program that must stay running all the time,
listening in the background, while the web server forwards `/api` requests to it.
Somebody has to start that program and restart it if the machine reboots or the
program crashes.

That is why **cheap shared hosting cannot run the Node backend**. On plans like
Aruba or cPanel you upload files into a folder and that's all you can do — there
is no way to start a program and keep it alive. If that's your host, choose PHP.
It isn't a limitation of Nibula.

> **Shared hosting** means a plan where you share a server with other customers
> and only get a folder to upload into. **A VPS** is a whole machine that is
> yours, where you can install and run whatever you want.

## Where you can publish

| Target | Frontend | PHP backend | Node backend |
|---|---|---|---|
| Shared hosting (Apache — Aruba, cPanel) | ✅ | ✅ | ❌ no program can stay running |
| Windows hosting (IIS) | ✅ | ✅ | ⚠️ only with the ARR module |
| Your own VPS (Nginx on Ubuntu) | ✅ | ✅ | ✅ |
| Static hosting (Netlify, Vercel, GitHub Pages) | ✅ | ❌ | ❌ |

Static hosting serves files and nothing else. Perfect if your site has no `/api`
endpoints, unusable if it does.

## What you need

**PHP backend:** a host with PHP support, and Composer to install the backend's
dependencies.

**Node backend:** Node.js 18 or newer, and command-line access to the server so
you can start the backend program.

## Editing the server config

Every server needs a configuration file telling it how to behave — which page to
show on a 404, which files to keep private, where to send `/api` requests. Nibula
writes these for you.

`.htaccess` (Apache) and `web.config` (IIS) are already inside `out`, ready to
upload. To change a rule, edit the original in `src/frontend/hosting/` — anything
you change directly inside `out` is erased the next time you build.

`nginx.conf` is different. It sits in your project root and is **not** copied into
`out`, because Nginx does not read config files from the site folder. You install
it on the server yourself, as described below.

---

## Shared hosting (Apache)

Upload **the contents of `out`** — not the folder itself — into your web root.
Depending on the host it is called `htdocs`, `public_html` or `www`.

That's it. `.htaccess` is already in there and Apache reads it automatically:
folder listings are off, errors show your `/404.html`, sensitive files are
blocked, the backend source is sealed off, and `/api/*` is routed.

**How `/api` gets routed:** if the server has a module called `mod_proxy`, `/api`
is forwarded to Node. If it doesn't — the usual case on shared hosting — `/api`
goes to PHP instead. To force PHP on a server that does have `mod_proxy`, comment
out the `mod_proxy` block in `.htaccess`.

## Windows hosting (IIS)

Same as above: upload the contents of `out`. `web.config` is already there and
read automatically.

**How `/api` gets routed:** to PHP, by default. To use Node instead, uncomment
the `ApiToNode` rule in `web.config` and delete `ApiToPhp`. This only works if
the server has the ARR and URL Rewrite modules with proxying turned on — which
means a server you control, not shared hosting.

> ⚠️ **If you chose Node and your host has no ARR** (Aruba and most Windows
> shared hosting), do **not** upload the `backend` folder. Without it the static
> site works fine and `/api/*` simply shows your `404.html`. Upload it and every
> `/api` request returns an empty 404 instead, because IIS sends the request to
> the PHP front controller — a file a Node project doesn't have.

---

## Your own server (Nginx on a VPS)

Nginx doesn't read config files from the site folder: the whole site is described
in one file kept elsewhere on the machine. Nibula ships that file, ready to use,
as `nginx.conf` in your project root.

It **handles both backends with no edits**: `/api` goes to Node, and if Node
isn't running the request falls through to PHP automatically.

Upload the contents of `out` to `/var/www/SITE_FOLDER`, then work through the
steps below.

### 1. Fill in the placeholders

Open `nginx.conf` on your computer and replace these four words with your own
values:

| Placeholder | What to put there |
|---|---|
| `YOUR_DOMAIN` | your domain — appears twice, once for port 80 and once for 443 |
| `SITE_FOLDER` | the folder name you used under `/var/www/` |
| `YOUR_CERTIFICATE` | the folder name under `/etc/letsencrypt/live/` |
| `SITE_NAME` | the file name you'll use in the commands below — pick anything |

### 2. Install what's missing

Skip anything already installed.

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

With the PHP backend, also:

```bash
sudo apt install -y php-fpm
```

### 3. Get an HTTPS certificate

This is what makes your site load over `https://` instead of `http://`.
Certificates are free and last 90 days; the second command renews them
automatically.

```bash
sudo certbot certonly --nginx --cert-name SITE_NAME -d YOUR_DOMAIN
sudo systemctl enable --now certbot.timer
```

### 4. Install the site file

```bash
# Go to the folder where Nginx keeps site files
cd /etc/nginx/sites-available

# Create the file and paste in the contents of your edited nginx.conf
sudo nano SITE_NAME
# Paste, then: CTRL + O, ENTER, CTRL + X

# Switch the site on by copying it into sites-enabled
sudo cp SITE_NAME ../sites-enabled/

# Check the config for mistakes, then apply it
sudo nginx -t && sudo systemctl reload nginx
```

If `nginx -t` reports an error, fix it before reloading — Nginx keeps running on
the old config until the reload succeeds, so your site stays up.

### If something goes wrong

| What you see | What it usually means |
|---|---|
| `cannot load certificate ... Permission denied` | you ran `nginx -t` without `sudo` |
| `cannot load certificate ... No such file` | wrong certificate name |
| `no alternative certificate subject name` | the certificate doesn't cover this domain |
| `unknown directive "http2"` | Nginx older than 1.25 — check with `nginx -v` |
| NXDOMAIN or a timeout during certbot | your domain's DNS isn't pointing at this server yet |
| A blank 500 instead of your 404 page | `404.html` is missing from the upload |
| 502 on `/api`, Node backend | the Node program isn't running |
| 502 on `/api`, PHP backend | wrong php-fpm socket path in the config |

---

## Starting the Node backend on the server

Only for the Node backend. After uploading `out`:

**1. Install its dependencies**

```bash
cd /var/www/SITE_FOLDER/backend
npm install
```

**2. Create its config file**

Make sure `config.js` exists in `out/backend/`. If it doesn't, copy
`example.config.js` to `config.js` and fill in your values.

**3. Try it out first**

`screen` lets you start a program, walk away, and come back to it later. Use it
to check the backend actually works before setting it up properly.

```bash
screen -S node-backend
# Inside the new screen:
sudo node /var/www/SITE_FOLDER/backend/_core/index.js
curl http://127.0.0.1:3000/api/example-public
```

If `curl` prints a JSON response, the backend is alive. Press `CTRL + A` then `D`
to leave the screen without stopping the program; `screen -r node-backend` brings
you back.

**4. Then set it up for real**

`screen` is for testing — the program dies if the server reboots. For a live site
use **systemd**, the part of Linux that manages background programs. It starts
your backend at boot and restarts it if it crashes.

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

Adjust `WorkingDirectory`, and check the path to `node` with `which node`. Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backend-node
sudo systemctl status backend-node
```

The last command should say `active (running)`.

(If you already use `pm2`, that works too:
`pm2 start _core/index.js --name backend-node`.)

### Settings the Node backend reads at startup

These are set in the systemd file, on their own lines, as
`Environment=KEY=value`. All three have sensible defaults — you usually don't
need to touch them.

| Setting | Default | What it does |
|---|---|---|
| `PORT` | `3000` | the port Node listens on — must match the one in `nginx.conf` |
| `HOST` | `127.0.0.1` | keep this as-is: it means "local only", so Node is reachable through the web server and not directly from the internet |
| `DOCUMENT_ROOT` | detected automatically | where `404.html` lives — the folder above `backend/` |

> Error detail is **not** set here. That's the `APP_ENV` key inside `config.js` /
> `config.php` — see `docs/Backend.md`.
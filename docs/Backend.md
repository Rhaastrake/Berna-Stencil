# Backend

Nibula ships **two interchangeable backends** in `src/backend/` — a **PHP** one
and a **Node.js** one. You pick which to use when you scaffold a project
(`nib new`). Both provide the same REST API: same routing, same `Response`
envelope, same `X-Api-Key` auth, same CORS model, same file-based rate limiter.
Only the language differs.

> **Server requirement** — where each backend can run:
>
> | Host | PHP | Node.js |
> |---|---|---|
> | Apache (shared hosting, VPS) | ✅ | ⚠️ needs a persistent process (VPS only) |
> | Nginx (VPS) | ⚠️ works, but the shipped `nginx.conf` targets Node — needs a manual `fastcgi_pass` block | ✅ (Nginx reverse-proxies to Node) |
> | IIS (Windows Server) | ✅ FastCGI | ✅ via ARR reverse proxy |
> | Static hosting (Netlify, Vercel, GitHub Pages, Cloudflare Pages) | ❌ | ❌ |
>
> Typical shared hosting can run **PHP** but not a long-running Node process, so
> choose PHP there. On a VPS you control, either works.

The backend lives in `src/backend/` and is copied to the output directory
automatically at build time.

## Choosing a backend

When you run `nib new`, the scaffolder asks three questions: language, CSS
framework, and **backend**. Pick Node.js or PHP.

- **If you pick Node**, Composer is never run — you get an npm-only setup, and
  the backend's dependency (`mysql2`, used only if you touch the database) is
  added to the **root** `package.json` and installed into the root `node_modules`.
- **If you pick PHP**, Composer dependencies are installed as before, and no Node
  backend files are added.

**Only the backend you choose is copied into the project.** A Node project
contains no PHP files; a PHP project contains no `.js` backend files. Shared,
backend-agnostic files (SQL migrations, `.htaccess`, `web.config`) are always
included.

## Structure

The structure below shows both backends for reference; **your project will have
only one side of each pair** (plus the shared files).

```
src/backend/
├── api/
│   ├── public/       # Endpoints accessible without an API key
│   └── protected/    # Endpoints requiring the X-Api-Key header
├── _core/            # Framework internals (routing, modules) — do not edit
│   ├── index.php     # PHP front controller            (PHP project)
│   ├── index.js      # Node front controller + server   (Node project)
│   ├── init.php / init.js
│   └── modules/      # Response, RateLimiter
├── database/
│   ├── Database.php  # PDO singleton                    (PHP project)
│   ├── Database.js   # mysql2 pool singleton            (Node project)
│   └── migrations/   # shared
├── package.json          # Node project only — backend deps + start script
├── example.config.php    # PHP project only  — versioned template
├── example.config.js     # Node project only — versioned template
├── config.php            # PHP project only  — generated on setup, never commit
└── config.js             # Node project only — generated on setup, never commit
```

> `config.php` / `config.js` are generated automatically by `nib new` (a copy of
> the matching `example.config.*`) and are git-ignored, so your secrets stay
> local. The `example.config.*` file is versioned as a secret-free reference. If
> `config.*` is ever missing (e.g. after a fresh clone), copy the example to it.

> **Where do the Node backend's dependencies live?** In the **root**
> `node_modules`, not in `src/backend` — so your source tree stays clean (no
> `src/backend/node_modules` locally). On the server you install them into
> `out/backend` instead; see `docs/Deploy.md`.

## Key difference: how each backend runs

- **PHP** is executed **per request** by the web server through PHP-FPM (or
  FastCGI/mod_php). There is no process to keep alive.
- **Node** is a **long-running process** that *is* the server, listening on
  `127.0.0.1:3000`. The web server (Nginx/Apache/IIS) **reverse-proxies** `/api`
  to it. You start it once and keep it alive (systemd/pm2). See `docs/Deploy.md`.

## Configuration

`config.php` / `config.js` work like a `.env` file — they hold secrets and
environment settings that stay local and out of version control. Same keys in
both, just PHP-array vs JS-object syntax.

### config.php <small>(`src/backend/`)</small>
```php
// Default key for protected endpoints without a specific key in CUSTOM_ENDPOINT_KEYS
'GENERAL_API_KEY' => 'DEFAULT_KEY',

// Per-endpoint keys. For subfolder endpoints use the relative path ('subfolder/endpoint')
'CUSTOM_ENDPOINT_KEYS' => [
    'subfolder/endpoint'    => 'custom-key',
],

'GENERAL_ALLOWED_ORIGINS' => [
    '*',
    // 'https://example.com',
],

'CUSTOM_ENDPOINT_ORIGINS' => [
    'subfolder/endpoint'    => ['https://app.example.com'],
],

// Database configuration
'DB_HOST' => '127.0.0.1',
'DB_NAME' => 'example_db',
'DB_USER' => 'root',
'DB_PASS' => '',
```

### config.js <small>(`src/backend/`)</small>
```js
module.exports = {
    GENERAL_API_KEY: 'DEFAULT_KEY',
    CUSTOM_ENDPOINT_KEYS: {
        'subfolder/endpoint': 'custom-key',
    },
    GENERAL_ALLOWED_ORIGINS: ['*' /*, 'https://example.com' */],
    CUSTOM_ENDPOINT_ORIGINS: {
        'subfolder/endpoint': ['https://app.example.com'],
    },
    DB_HOST: '127.0.0.1',
    DB_NAME: 'example_db',
    DB_USER: 'root',
    DB_PASS: '',
    APP_ENV: 'production', // anything other than 'production' = verbose errors
};
```

### API keys

`GENERAL_API_KEY` is the fallback key for all protected endpoints. Use
`CUSTOM_ENDPOINT_KEYS` to assign a different key to a specific endpoint — for
subfolder endpoints, use the relative path as the key.

> ⚠️ The API key travels in the `X-Api-Key` header on every request. Use it only
> for server-to-server calls over HTTPS. Never embed it in frontend code, where
> it would be publicly visible.

### CORS (allowed origins)

Cross-origin access mirrors the API-key model:

- `GENERAL_ALLOWED_ORIGINS` — the default list of origins allowed to call any
  endpoint from a browser.
- `CUSTOM_ENDPOINT_ORIGINS` — overrides the default for a specific endpoint,
  keyed by the same relative path used in `CUSTOM_ENDPOINT_KEYS`.

Origins must be exact (scheme + host, no trailing slash), e.g.
`https://example.com`. When a request's `Origin` is in the resolved list, it is
reflected back in `Access-Control-Allow-Origin` (with `Vary: Origin`). An empty
list sends no CORS header — the most restrictive setting; same-origin requests
still work. Use `'*'` as the only element to allow any origin (not recommended
for protected endpoints).

Resolution order for a given endpoint: `CUSTOM_ENDPOINT_ORIGINS[path]` if
present, otherwise `GENERAL_ALLOWED_ORIGINS`.

## How routing works

The file path inside `api/` maps directly to the URL. The `public`/`protected`
folder does **not** appear in the URL — it only decides whether the `X-Api-Key`
check applies. So `api/public/example-public` and `api/protected/example-protected`
are both reached at `/api/<endpoint>`:

- `api/public/example-public` → `/api/example-public` (no key)
- `api/protected/example-protected` → `/api/example-protected` (requires key)

Subfolders **do** appear: `api/public/users/list` → `/api/users/list`. Extra URL
segments become route parameters. Every endpoint has access to:

| Variable / field | Description |
|---|---|
| `method` | HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) |
| `requestParams` | Extra URL segments (e.g. `/api/posts/42` → `['42']`) |

> If two files share the same path — one in `public/`, one in `protected/` — the
> public one wins (it is checked first), so the endpoint ends up **without**
> authentication. Don't duplicate names across the two folders.

> **About the examples below** — the code samples use **JavaScript (the Node
> backend)** as the reference. That's just the example language: if you chose the
> **PHP** backend it works exactly the same way, with the same variables, the
> same `Response` helper and the same behaviour — only the syntax differs. Each
> section shows the JS version first, with the equivalent PHP right after.

## Creating a public endpoint

Create a file anywhere inside `api/public/`.

### `api/public/example.js` (Node — reference)
```js
module.exports = ({ method, requestParams, Response }) => {
    if (method !== 'GET') Response.error('Method not allowed', 405);
    const id = requestParams[0] ? parseInt(requestParams[0], 10) : null;
    Response.success({ id });
};
```

The Node handler receives a context object: `method`, `requestParams`,
`Response` (`.success` / `.error` / `.noContent`), plus `query`, `body` (parsed
JSON), `rawBody`, `headers`, `config`, `req`, `res`.

The same endpoint in PHP — identical logic, PHP syntax:
```php
<?php
declare(strict_types=1);

require_once CORE_PATH . '/modules/Response.php';

if ($method !== 'GET') {
    Response::error('Method not allowed', 405);
}

$id = isset($requestParams[0]) ? (int)$requestParams[0] : null;

Response::success(['id' => $id]);
```

## Creating a protected endpoint

Create a file inside `api/protected/`. The API-key check happens automatically
before your file runs.

### `api/protected/example.js` (Node — reference)
```js
module.exports = ({ method, Response }) => {
    if (method !== 'GET') Response.error('Method not allowed', 405);
    Response.success({ visits: 1024 });
};
```

The same endpoint in PHP:
```php
<?php
declare(strict_types=1);

require_once CORE_PATH . '/modules/Response.php';

if ($method !== 'GET') {
    Response::error('Method not allowed', 405);
}

Response::success(['visits' => 1024]);
```

To assign a dedicated key, add it to your config:

```js
CUSTOM_ENDPOINT_KEYS: { 'endpoint': 'custom-key' }          // config.js
```
```php
'CUSTOM_ENDPOINT_KEYS' => [ 'endpoint' => 'custom-key' ],   // config.php
```

## The Response helper

Identical envelope in both backends — JS shown as reference, PHP works the same:

```js
Response.success(data, code);            // default 200
Response.error(message, code, details);  // default 400
Response.noContent();                    // 204
```
```php
Response::success($data, $code);            // default 200
Response::error($message, $code, $details); // default 400
Response::noContent();                       // 204
```

Response shapes:
- success → `{ "status": "success", "data": ... }`
- error → `{ "status": "error", "message": "...", "code": ... }` (+ optional `details`)

## Database

Both backends expose a connection singleton reading the same config.

- **Node** (reference) — `database/Database.js`, a `mysql2` pool singleton:
  `const pool = Database.getInstance(); const [rows] = await pool.execute(sql, params);`
  The `mysql2` driver is installed at scaffold time when you choose Node (it is
  loaded lazily, so the backend also boots fine without a database).
- **PHP** — `database/Database.php`, a PDO singleton:
  `$pdo = Database::getInstance();`

## Pre-built endpoints

| Route | Method | Description |
|---|---|---|
| `/api/example-public` | `GET` | Example endpoint that doesn't require any key |
| `/api/example-protected` | `GET` | Example endpoint that requires `X-Api-Key` |
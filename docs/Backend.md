# Backend

Nibula ships **two interchangeable backends** — PHP and Node.js. You pick one
when you scaffold a project with `nib new`, and **only that one is copied into
your project**: a Node project contains no PHP files and vice versa. Shared,
backend-agnostic files (SQL migrations, `.htaccess`, `web.config`) are always
included.

Both provide the same REST API: same routing, same `Response` envelope, same
`X-Api-Key` auth, same CORS model, same rate limiter. Only the syntax differs.

> **The examples below are in JavaScript (the Node backend).** If you chose PHP,
> everything works exactly the same way — same routing, same variables, same
> `Response` helper, same behaviour. Only the syntax differs.

For **where each backend can run** and how to deploy it, see `docs/Deploy.md`.

## Structure

The tree below shows both backends for reference; your project will have only
one side of each pair.

```
src/backend/
├── api/
│   ├── public/       # Endpoints accessible without an API key
│   └── protected/    # Endpoints requiring the X-Api-Key header
├── _core/            # Framework internals (routing, modules) — do not edit
│   ├── index.php     # PHP front controller           (PHP project)
│   ├── index.js      # Node front controller + server (Node project)
│   ├── init.php / init.js
│   └── modules/      # Response, RateLimiter
├── database/
│   ├── Database.php  # PDO singleton                  (PHP project)
│   ├── Database.js   # mysql2 pool singleton          (Node project)
│   └── migrations/   # shared
├── example.config.php / example.config.js   # versioned template
└── config.php / config.js                   # generated on setup, never commit
```

> `config.php` / `config.js` are created automatically by `nib new` as a copy of
> the matching `example.config.*`, and are git-ignored so your secrets stay
> local. If `config.*` is missing (e.g. after a fresh clone), copy the example.

### Installing Composer packages (PHP)

Backend dependencies live in `src/backend/_core`, next to `composer.json`.
Install from there, not from the project root:

```bash
cd src/backend/_core
composer require vendor/package
```

`_core/init.php` already requires Composer's autoloader, so an installed package
is usable in your endpoints straight away — there is no extra `require` to add.

Packages land in `src/backend/_core/vendor/`, which is git-ignored. After a fresh
clone that folder is missing and the backend won't start at all: run
`composer install` from `src/backend/_core` to restore it.

## How routing works

The file path inside `api/` maps directly to the URL. The `public` / `protected`
folder does **not** appear in the URL — it only decides whether the `X-Api-Key`
check applies:

- `api/public/example-public` → `/api/example-public` (no key)
- `api/protected/example-protected` → `/api/example-protected` (requires key)

Subfolders **do** appear: `api/public/users/list` → `/api/users/list`.

Extra URL segments become route parameters, resolved from the deepest match
backwards: `/api/posts/42` looks for `posts/42` first, then falls back to
`posts` with `42` as a parameter.

Every endpoint receives:

| Field | Description |
|---|---|
| `method` | HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) |
| `requestParams` | Extra URL segments (e.g. `/api/posts/42` → `['42']`) |

The Node handler also gets `query`, `body` (parsed JSON), `rawBody`, `headers`,
`config`, `req`, `res`.

> ⚠️ If two files share the same path — one in `public/`, one in `protected/` —
> the public one wins, so the endpoint ends up **without** authentication. Don't
> duplicate names across the two folders.

## Creating an endpoint

Create a file anywhere inside `api/public/` or `api/protected/`. For protected
endpoints the API-key check runs automatically before your file does.

```js
module.exports = ({ method, requestParams, Response }) => {
    if (method !== 'GET') Response.error('Method not allowed', 405);
    const id = requestParams[0] ? parseInt(requestParams[0], 10) : null;
    Response.success({ id });
};
```

## The Response helper

Same envelope in both backends.

```js
Response.success(data, code);            // default 200
Response.error(message, code, details);  // default 400
Response.noContent();                    // 204
```

Shapes:

- success → `{ "status": "success", "data": ... }`
- error → `{ "status": "error", "message": "...", "code": ... }` (+ optional `details`)

## Configuration

`config.php` / `config.js` work like a `.env` file: they hold secrets and
environment settings that stay local and out of version control. Same keys in
both, PHP-array vs JS-object syntax.

```js
module.exports = {
    // Default key for protected endpoints that don't have a specific key in CUSTOM_ENDPOINT_KEYS
    GENERAL_API_KEY: 'DEFAULT_KEY',

    // If you want to restrict access to protected endpoints to specific clients, define custom keys per endpoint.
    // For subfolder endpoints, use the relative path ('subfolder/endpoint')
    CUSTOM_ENDPOINT_KEYS: {
        'subfolder/example-protected': 'custom-key',
    },

    GENERAL_ALLOWED_ORIGINS: [
        '*',
        // 'https://example.com',
    ],

    CUSTOM_ENDPOINT_ORIGINS: {
        'subfolder/example-protected': ['https://app.example.com'],
    },

    // Database configuration
    DB_HOST: '127.0.0.1',
    DB_NAME: 'example_db',
    DB_USER: 'root',
    DB_PASS: '',

    // Environment: 'production' hides error details; anything else = debug.
    APP_ENV: 'production',
};
```

### API keys

`GENERAL_API_KEY` is the fallback for all protected endpoints.
`CUSTOM_ENDPOINT_KEYS` assigns a different key to a specific endpoint, keyed by
its relative path (`'subfolder/endpoint'`).

> ⚠️ The key travels in the `X-Api-Key` header on every request. Use it only for
> server-to-server calls over HTTPS. Never embed it in frontend code, where it
> would be publicly visible.

### CORS

Mirrors the API-key model: `GENERAL_ALLOWED_ORIGINS` is the default list,
`CUSTOM_ENDPOINT_ORIGINS` overrides it per endpoint using the same relative path.

Origins must be exact (scheme + host, no trailing slash). A matching `Origin` is
reflected in `Access-Control-Allow-Origin` with `Vary: Origin`. An empty list
sends no CORS header — the most restrictive setting; same-origin requests still
work. `'*'` as the only element allows any origin (not recommended for protected
endpoints).

Resolution order: `CUSTOM_ENDPOINT_ORIGINS[path]` if present, otherwise
`GENERAL_ALLOWED_ORIGINS`.

### Error verbosity

`APP_ENV` decides what an unhandled exception tells the client.

| Value | Response to a 500 |
|---|---|
| `'production'` (default) | `{"status":"error","message":"Internal server error","code":500}` |
| anything else | the real exception message, plus `stack` (Node) or `file` and `line` (PHP) |

On PHP it does one extra thing: `'production'` also turns off `display_errors`
and `error_reporting`, so a stray warning can't be printed before the JSON and
corrupt the response body.

Set it to something like `'development'` while building, and back to
`'production'` before you publish. Missing key means `'production'`.

> This is a config key, **not** an environment variable. Setting `APP_ENV` in a
> shell or in a systemd unit has no effect — both backends read it from
> `config.js` / `config.php` only.

## Database

Both backends expose a connection singleton reading the same config —
`database/Database.js` (a `mysql2` pool) or `database/Database.php` (a PDO
singleton).

```js
const pool = Database.getInstance();
const [rows] = await pool.execute(sql, params);
```

`mysql2` is installed at scaffold time and loaded lazily, so the backend boots
fine without a database.

## Pre-built endpoints

| Route | Method | Description |
|---|---|---|
| `/api/example-public` | `GET` | Example endpoint requiring no key |
| `/api/example-protected` | `GET` | Example endpoint requiring `X-Api-Key` |
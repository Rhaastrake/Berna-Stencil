# ✏️ Nibula

**Nibula** is an open source static site generator built on top of [Eleventy](https://www.11ty.dev/), with one clear mission: make the jump from plain, hand-written websites to a real project setup as gentle as possible — without ever pulling you away from the web you already know.

If you've only ever written HTML, CSS, and a bit of JavaScript, moving to a "framework" usually feels like starting over: new syntax, new rules, new folder structures, and a pile of documentation before you can even see a page on screen. Nibula is designed to avoid exactly that. You keep working with the **three languages that matter — HTML, CSS, and JavaScript** — and the tool quietly handles the tedious parts around them. The goal is simple: even someone with little experience should always know *where to put their hands*.

It's a great fit for **showcase and brochure-style websites** (portfolios, landing pages, small business sites), where you want something clean and fast without dragging in a heavy framework.

### ✨ Why Nibula?

Building a website from scratch involves a lot of moving parts: templating, build steps, SEO files, server config, project structure. Nibula takes care of all of that for you, so you can focus on what actually matters — **your content and your ideas** — while still learning skills that transfer anywhere on the web.

- 🔧 **Zero-config ready** — install, create, and you're live in minutes
- 🧭 **Stays close to vanilla** — real HTML, CSS, and JS, so nothing you learn goes to waste
- 🔎 **SEO made simple** — managed from one central place; `sitemap`, `llms.txt`, and `robots.txt` are generated automatically
- 🖱️ **A helpful CLI** — create a page with one command instead of hand-writing ten separate files
- ⚙️ **Server configs handled for you** — `.htaccess` and `web.config` are generated automatically, and an `nginx.conf` is provided so that anyone comfortable with nginx already has what they need to run the site outside of shared hosting
- 🎨 **Pick your CSS framework** — choose from 4 pre-installed options (or none), and switch later in a few guided steps
- 🔌 **Pick your backend** — Node.js or PHP, chosen at creation; **Composer is only needed for PHP**
- 🧩 **Your own modules** — add your own CSS and JS/TS modules freely and easily
- 🪶 **Lightweight by default** — SCSS frameworks can be filtered so you ship only what you actually use
- 🌍 **Open source** — free to use, free to modify, free to share

![Version](https://img.shields.io/badge/version-1.2.4-blue)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![Eleventy](https://img.shields.io/badge/11ty-v3.1.2-black)

## JavaScript or TypeScript — your choice

When you create a project, you decide how you want to work:

- **JavaScript** — the simplest path, ideal if you're still getting comfortable.
- **TypeScript** — for more experienced users who want stronger typing and tooling.

Either way, the project structure stays the same, so you can start easy and level up later.

## Backend included

Essential server-side functionality comes built in — no extra setup required. At project creation you **choose your backend: Node.js or PHP** (Python is planned). Both expose the **same REST API** — same routing, `X-Api-Key` auth, CORS and rate limiting — so you can even switch later without rewriting your endpoints. See [docs/Backend.md](docs/Backend.md) for details.

## Customizable, but with sensible defaults

Nibula ships with a clean, opinionated layout so beginners are never lost. But it isn't a cage: as long as you follow a few small conventions and the defined paths, you're free to customize the subpaths of your **components, backend endpoints, and JS/SCSS modules** however you like.

## Prerequisites

### Required

* **Node.js**: v18.0.0 or higher — **always required** (the Nibula CLI, the build, and the optional Node backend all run on Node)
* **Composer**: **only required if you choose the PHP backend**, to install its PHP dependencies. If you pick the **Node** backend, Composer is never used — you can skip installing it entirely.
### Recomended
* *Suggested:* **Better Nunjucks** VS Code extension by Ed Heltzel
* *Suggester:* **Material Icon Theme** VS Code extension by Philipp Kief

## Installation

Install the Nibula CLI once, globally:

```
npm install -g nibula
```

This gives you the `nib` command (Alternatives: `nbl`, `nibula`).

## Create a project

From the folder where you keep your websites, run:

```
nib new your-project
```

The scaffolder is interactive: you choose the **language** (JavaScript/TypeScript), the **CSS framework**, and the **backend** (Node.js or PHP). All dependencies are installed automatically — and if you pick **Node**, the PHP/Composer step is skipped, so you don't need Composer at all.

Then start the dev server and visit `localhost:8080`:

```
cd your-project
nib run
```

## Commands

Run these from anywhere inside a project (except `nib new`, which you run wherever you want to create the project):

| Command | Description |
|---|---|
| `nib new <name>` | Create your new project |
| `nib run` | Start the dev server and build the output folder at runtime |
| `nib cli` | Open the page-management assistant |
| `nib build` | Build the output folder runtime |
| `nib clean` | Remove the output directory |
| `nib update` | Update the CLI to the latest version |

Before scaffolding, nib new checks the npm registry for a newer version and offers to update first. If you accept, Nibula updates itself and then creates the project with the new version automatically — no need to re-run the command. If the registry is unreachable, the check is skipped and creation proceeds normally.

## Managing pages

Instead of creating and wiring up multiple files by hand, let the interactive assistant do it for you. To create, remove, or rename pages and configure the output path, run:

```bash
nib cli
```

See [docs/Assistant CLI.md](docs/Assistant%20CLI.md) for details.

## Deploying

Nibula builds a static site into your `out` folder, which you upload to a web
server. Which backend you chose affects deployment:

- **PHP** runs on ordinary shared hosting (Apache/IIS) or a VPS with PHP-FPM — no process to keep alive.
- **Node** runs as a long-running service on a VPS; the web server reverse-proxies `/api` to it.

The shipped `.htaccess`, `web.config` and `nginx.conf` cover **both** backends.
See [docs/Deploy.md](docs/Deploy.md) for the full guide, including how to start
the Node service on your server.

## Roadmap

* [ ] Add support for multiple themes
* [x] Backend integration choice — pick **PHP or Node.js** at creation (Python planned)
* [ ] Extend documentation with advanced usage examples
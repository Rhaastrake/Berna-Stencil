# ✏️ Nibula

[![Version](https://img.shields.io/npm/v/nibula?label=version&color=blue)](https://www.npmjs.com/package/nibula)
[![License](https://img.shields.io/npm/l/nibula?color=blue)](LICENSE)
![Eleventy](https://img.shields.io/badge/built%20on-11ty-black?logo=eleventy)

**Nibula** is an open source static site generator built on top of [Eleventy](https://www.11ty.dev/), with one clear mission: make the jump from small hand-written practice sites to a real project setup as gentle as possible.

If you've only ever written HTML, CSS, and a bit of JavaScript, moving to a "framework" usually feels like starting over: new syntax, new rules, new folder structures, and a pile of documentation before you can even see a page on screen. Nibula is designed to avoid exactly that. You keep working with the **three languages that matter — HTML, CSS, and JavaScript** — and the tool quietly handles the tedious parts around them. The goal is simple: even someone with little experience should always know *where to put their hands*.

### ✨ Why choose Nibula?

It's a great fit for **showcase and brochure-style websites** (portfolios, landing pages, small business sites), when you want something clean and fast without dragging in a framework that takes weeks to learn and handle.

Building a website from scratch means putting together a lot of moving parts: SEO, dependency setup, deployment and server configuration, project structure. Nibula takes care of all of that for you, so you can focus on your content — while still picking up conventions and working habits that are common to the most widely used frameworks, Angular among them.

### 📌 Other things worth knowing

- 🔎 **SEO made simple** — managed from one central place; `sitemap`, `llms.txt`, and `robots.txt` are generated automatically
- 🖱️ **A helpful CLI** — create a page with one command instead of hand-writing ten separate files
- ⚙️ **Server configs handled for you** — `.htaccess` and `web.config` are generated automatically, and an `nginx.conf` is provided so that anyone comfortable with nginx already has what they need to run the site outside of shared hosting
- 🎨 **Pick your CSS framework** — choose from 4 pre-installed options (or none), and switch later in a few guided steps
- 🔌 **Pick your backend** — Node.js or PHP, chosen at creation (choose carefully, based on where you plan to publish)
- 🧩 **Your own modules** — add your own SCSS and JS/TS modules freely and easily
- 🪶 **Lightweight by default** — SCSS frameworks can be filtered so you ship only what you actually use

### 🤔 When not to choose it?

- **Heavily stateful interfaces** — dashboards, admin panels, editors, anything that keeps changing under the user's hands. A single-page application with React, Vue, or Angular is the right tool there.
- **Pages generated at request time** — catalogues that depend on the logged-in user, personalised pricing, content that changes by the minute. Nibula builds pages beforehand, not during the visit.

## ⚙️ Backend included

Essential server-side functionality comes built in — no extra setup required. At project creation you **choose your backend: Node.js or PHP**. Both expose the **same REST API** — same routing, `X-Api-Key` auth, CORS and rate limiting — so you can even switch later without rewriting your endpoints. See [docs/Backend.md](docs/Backend.md) for details.

## 🧭 Customizable, but with sensible defaults

Nibula ships with a clean, opinionated layout so beginners are never lost. But it isn't a cage: as long as you follow a few small conventions and the defined paths, you're free to customize the subpaths of your **components, backend endpoints, and JS/SCSS modules** however you like.

## 📋 Prerequisites

### Required

* **Node.js**: v18.0.0 or higher
* **Composer** *(only if you choose the PHP backend)*: latest version

### Recommended

* **Better Nunjucks** — VS Code extension by **Ed Heltzel**
* **Material Icon Theme** — VS Code extension by **Philipp Kief**

## 📦 Installation

Install Nibula once, globally:

```
npm install -g nibula
```

This gives you the `nib` command (alternatives: `nbl`, `nibula`).

## 🚀 Create a project

From the folder where you keep your websites, run:

```
nib new your-project
```

The scaffolder is interactive: you choose the **language** (JavaScript/TypeScript), the **CSS framework**, and the **backend** (Node.js or PHP). All dependencies are installed automatically — and if you pick **Node**, the PHP/Composer step is skipped, so you don't need Composer at all.

Once the dependencies are installed, move into the project folder and start the dev server (`localhost:8080`):

```
cd your-project
nib run
```

## 💻 Commands

Run these from anywhere inside a project — except `nib new`, which must be run **outside** a project, in the folder where you want the new one created.

| Command | Description |
|---|---|
| `nib new <name>` | Create your new project |
| `nib run` | Start the dev server and build the output folder at runtime |
| `nib cli` | Open the page-management assistant |
| `nib build` | Build the output folder |
| `nib clean` | Remove the output directory |
| `nib update` | Update Nibula to the latest version (applies from your next project on) |

## 📄 Managing pages

Instead of creating and wiring up multiple files by hand, let the interactive assistant do it for you. To create, remove, or rename pages and configure the output path, run:

```bash
nib cli
```

See [docs/Assistant CLI.md](docs/Assistant%20CLI.md) for details.

## 🌍 Deploying

Nibula builds a static site into your `out` folder, which you upload to a web
server. Which backend you chose affects deployment:

- **Node** runs as a long-running service on a VPS; the web server reverse-proxies `/api` to it.
- **PHP** runs on ordinary shared hosting (Apache/IIS) or a VPS with PHP-FPM — no process to keep alive.

The shipped `.htaccess`, `web.config` and `nginx.conf` cover **both** backends.
See [docs/Deploy.md](docs/Deploy.md) for the full guide, including how to start
the Node service on your server.

## 🙌 Wrapping up

Thanks for giving Nibula a try.

It's a one-person project, so every bit of feedback counts more than you'd think: if something breaks, if the documentation isn't clear, or if a feature is missing, open an [issue](https://github.com/Rhaastrake/Nibula/issues) — even just to tell me what you built with it.

If Nibula was useful to you, leaving a ⭐ on the repository is the easiest way to help other people find it.
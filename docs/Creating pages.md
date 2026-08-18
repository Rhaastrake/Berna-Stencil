# Creating Pages

> Examples use JavaScript, but everything applies equally to TypeScript. The only difference is the file extension (`.ts` instead of `.js`), that imports do **not** include the extension, and that paths use `src/frontend/ts/` instead of `src/frontend/js/`.

The recommended way is via the **Assistant CLI**

## What gets created
For a page named `my-page`:

| File | Purpose |
|---|---|
| `src/frontend/routes/my-page.njk` | Template with front matter |
| `src/frontend/scss/pages/myPage.scss` | Imports framework + modules |
| `src/frontend/js/pages/myPage.js` | Imports JS/TS modules |

It also adds a stub entry in `src/frontend/data/pages.json` for the page's SEO and CDN links — fill it in as described in the **Head & SEO** DOC file.

## Adding content

The route is created empty, with two commented examples: one for including a
`.njk` component, one for rendering a `.md` file. Uncomment the one you need or
write your HTML directly in the body — see the **Components** DOC file.

## URL and title

The URL is the kebab-case name (`/my-page/`). The `title` in the front matter is camelCase (`myPage`) and is used internally to load the correct CSS and JS files, and to look up the page's record in `pages.json` — do not change it.

## Layout

`layout` decides the HTML skeleton the page is rendered into. New pages get `base.njk`, which brings the head, the SEO tags, the header and the footer.

A page that needs a different shell — a landing page with no header, for instance — points at a layout of its own. See **Components** DOC file, *Custom layouts*.

## Subpages (nested URLs)

To create a URL like `domain.it/about/team`, edit the `permalink` in `src/frontend/routes/team.njk` and add the parent segment before the final slash:

```js
---
title: "team"
permalink: "/about/team/"
layout: base.njk
---
```

The parent path (`about`) does **not** need to exist as a real page — it's just a URL prefix. Only the last segment (`team`) must match the filename and the `title` in the front matter.

| Goal URL | permalink value | File |
|---|---|---|
| `/team/` | `/team/` | `routes/team.njk` |
| `/about/team/` | `/about/team/` | `routes/team.njk` |
| `/company/about/team/` | `/company/about/team/` | `routes/team.njk` |
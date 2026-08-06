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

## Adding content

1. Create a component in `src/frontend/components/` (e.g. `my-component.njk`)
2. Include it in `src/frontend/layouts/page-components.njk` inside the generated `elif` block:

```njk
{% elif title == "myPage" %}
  {% include "my-component.njk" ignore missing %}
```

See **Components** DOC file for more info

## URL and title

The URL is the kebab-case name (`/my-page/`). The `title` in the front matter is camelCase (`myPage`) and is used internally to load the correct CSS and JS files — do not change it.

## Subpages (nested URLs)

To create a URL like `domain.it/about/team`, edit the `permalink` in `src/frontend/routes/team.njk` and add the parent segment before the final slash:

```njk
---
title: "team"
permalink: "about/team/"
layout: page-components.njk
---
```

The parent path (`about`) does **not** need to exist as a real page — it's just a URL prefix. Only the last segment (`team`) must match the filename and the `title` in the front matter.

| Goal URL | permalink value | File |
|---|---|---|
| `/team/` | `/team/` | `routes/team.njk` |
| `/about/team/` | `/about/team/` | `routes/team.njk` |
| `/company/about/team/` | `/company/about/team/` | `routes/team.njk` |

## SEO

The CLI creates a stub entry in `src/frontend/data/pages.json`. Fill it in:

```json
    "myPage": {
      "seo": {
        "title": "My Page",
        "description": "Description",
        "keywords": "",
        "noindex": false,
        "canonical": ""
      },
      "cdn": {
        "css": [],
        "js": []
      }
    }
```
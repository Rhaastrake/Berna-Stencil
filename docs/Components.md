# Nunjucks (HTML) Components

## What is Nunjucks

Nunjucks (`.njk`) is an HTML file that supports logic like variables, `if` statements, and `for` loops. It can extend a base layout and include other `.njk` components

## Create a component

Create a new `.njk` file anywhere inside `src/frontend/components/`. You can organize them into subfolders freely

```
src/frontend/components/
├── global/
│   ├── header.njk
│   └── footer.njk
├── modals/
│   └── privacyModal.njk
├── not-found.njk
├── welcome.njk
```

## Include a component

Components are included in the page that renders them. Open the page's file in `src/frontend/routes/` and write the includes in its body

### example-page.njk <small>(`src/frontend/routes/`)</small>

```njk
---
title: "examplePage"
permalink: "/example-page/"
layout: base.njk
---

{% include "example-component-1.njk" %}
{% include "subfolder/example-component-2.njk" %}
```

Components render in the order you list them. If a component lives in a subfolder, specify the relative path accordingly

Paths are resolved from `src/frontend/components/`, so you never write that part — `"welcome.njk"`, not `"components/welcome.njk"`

> ⚠️ If you move or delete a component, update every route that includes it or the build will fail

Writing HTML directly in the route works too, and is perfectly fine for a short page. Components are the recommendation when there is something to reuse or when a page grows past a screenful — not a rule

## Nest components

A component can include other components. This is useful for breaking complex sections into smaller, reusable pieces.

### exampleComponent.njk
```njk
<section class="hero">
  {% include "hero/hero-title.njk" %}
  {% include "hero/hero-button.njk" %}
</section>
```

> The same path rules apply: if the included component is in a subfolder, specify the full relative path.

## Global components

Header and footer live in `src/frontend/components/global/` and are automatically included in every page via `base.njk`. Edit them to change the site-wide layout

## Custom layouts

`base.njk` is the default layout, but it isn't the only one you can have. Any
`.njk` file in `src/frontend/layouts/` is a layout, and each route picks its own.

The usual reason is a page that doesn't fit the standard shell: a landing page
with no header or footer, a full-screen login, a "coming soon" holding page.

Copy `base.njk`, rename it, and change only what you need — that way you keep the
head, the SEO tags and the CSS/JS wiring, which is the part you don't want to
rewrite:

```
src/frontend/layouts/
├── base.njk
└── custom.njk
```

### custom.njk <small>(`src/frontend/layouts/`)</small>

Same as `base.njk`, without the two global includes:

```njk
<body>
    <main>
        {{ content | safe }}
    </main>
</body>
```

Then point the route at it:

### landing.njk <small>(`src/frontend/routes/`)</small>

```njk
---
title: "landing"
permalink: "/landing/"
layout: custom.njk
---
```

Paths are resolved from `src/frontend/layouts/`, so you write `"custom.njk"`, not
`"layouts/custom.njk"` — the same rule as components.

> ⚠️ A layout you copy is a copy: a later fix to `base.njk` won't reach it. Keep
> the differences to the minimum, and check your custom layouts when you change
> something in the head.

## Site data in components

All values defined in `src/frontend/data/site.json` are globally available in every component via `{{ site.* }}`

### site.json <small>(`src/frontend/data/`)</small>
```json
{
  "site_name": "Site name",
  "title": "Site title",
  "description": "Site description",
  "keywords": "keyword1, keyword2, keyword3",
  "domain": "yoursite.com",
  "url": "https://yoursite.com",
  "lang": "en",
  "author": "Name and surname",
  "logo": "/assets/brand/logo.svg",
  "legal": {
    "privacy": "",
    "cookie": "",
    "terms": "",
    "copyright": {
      "year": "2026",
      "text": "All rights reserved."
    }
  }
}
```

`legal.privacy`, `legal.cookie` and `legal.terms` hold the URLs of your legal pages — the footer links to them. See **Head & SEO** DOC file for what every field does

### Usage in any `.njk` file
```njk
<p>{{ site.title }}</p>
<a href="{{ site.legal.privacy }}">Privacy Policy</a>
<img src="{{ site.logo }}" alt="{{ site.title }}">
```

## Your own data files

`site.json` isn't special: **any** `.json` file you drop in `src/frontend/data/` becomes a global variable, and the variable takes the name of the file.

Create `test.json`, put anything you want inside it, and every key is reachable as `test.yourKey` — no import, no configuration, no restart.

### test.json <small>(`src/frontend/data/`)</small>
```json
{
  "testMessage": "This is a test"
}
```

### Usage in any `.njk` file
```njk
<p>{{ test.testMessage }}</p>
```

Renders as:
```html
<p>This is a test</p>
```

That's the whole rule: **file name = variable name, keys inside = what you write after the dot.** `site.json` gives you `site.title` for exactly the same reason.

Values can be anything JSON allows, so a list lets you loop instead of copying markup:

```json
{
  "testMessage": "This is a test",
  "links": [
    { "label": "Home",    "url": "/" },
    { "label": "Contact", "url": "/contact/" }
  ]
}
```

```njk
{% for link in test.links %}
  <a href="{{ link.url }}">{{ link.label }}</a>
{% endfor %}
```

Subfolders create nested names: `data/shop/products.json` becomes `{{ shop.products }}`.

> ⚠️ Don't reuse a name that already exists. Another file named `site.json` in a subfolder overwrites the original one silently, with no error to point you at the cause.
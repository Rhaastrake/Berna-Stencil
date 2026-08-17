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

## Markdown files

### What is Markdown

Markdown (`.md`) is a way to write formatted text without HTML tags. You write
`**bold**` instead of `<strong>bold</strong>`, and a line starting with `-`
becomes a list item. For a page that is mostly text — an article, a privacy
policy, a changelog — it is much faster than writing the markup by hand.

### Write the file

Create a `.md` file in `src/frontend/components/`, next to your `.njk` ones.

#### article.md <small>(`src/frontend/components/`)</small>

```markdown
## Section title

Regular paragraph text. **Bold** and *italic* work as usual.

- First item
- Second item
```

### Show it in a page

Open the page's file in `src/frontend/routes/` and add this line to its body:

```njk
{% renderFile "article.md" | markdownPath, { site: site } %}
```

Three parts to it:

| Part | What it does |
|---|---|
| `renderFile` | turns the Markdown into HTML and puts it in the page |
| `markdownPath` | fills in the `src/frontend/components/` part of the path for you |
| `{ site: site }` | hands the file your site settings — see below |

Subfolders work the same way as with components:
`"legal/privacy.md" | markdownPath`

### Why `{ site: site }`

A `.md` file can use site values, exactly like a component:

```markdown
Welcome to {{ site.title }}
```

But a Markdown file does not automatically see them. Anything the file needs has
to be listed in the curly braces:

```njk
{% renderFile "article.md" | markdownPath, { site: site, pages: pages } %}
```

If you forget, nothing breaks — the value simply comes out empty. So if a
`{{ site.something }}` disappears from your page, this is why.

### Extras you get for free

**Links to a section.** Every `##` and `###` heading gets an anchor, so you can
link straight to it: `yoursite.com/my-page/#section-title`.

**CSS classes.** Markdown produces plain HTML with no classes, so your framework's
styling doesn't reach it. Add a class in curly braces after the element:

```markdown
## Section title {.text-center}
```

> ⚠️ If the `.md` file is missing or the name is misspelled, the build stops with
> an error. That is on purpose: silently skipping content you asked for is worse.

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

> In a `.md` file rendered with `renderFile`, these values only work if you passed
> `site` in the curly braces — see *Why `{ site: site }`* above.

## Your own data files

`site.json` isn't special: **any** `.json` file you drop in `src/frontend/data/` becomes a global variable, and the variable takes the name of the file.

Create `test.json`, put anything you want inside it, and every key is reachable as `test.yourKey` — no import, no configuration, no restart.
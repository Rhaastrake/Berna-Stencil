# Nunjucks (HTML) Components

## What is Nunjucks

Nunjucks (`.njk`) is an HTML file that supports logic like variables, `if` statements, and `for` loops. It can extend a base layout and include other `.njk` components

## Create a component

Create a new `.njk` file anywhere inside `src/frontend/components/`. You can organize them into subfolders freely

```
src/frontend/components/
├── global/
├── layouts/
├── modals/
│   └── privacyModal.njk # You can move it to a modals/subfolder
├── welcome.njk
```

## Include a component

To render a component inside a page, navigate to `src/frontend/layouts/` and edit `page-components.njk`

### page-components.njk <small>(`src/frontend/layouts/`)</small>

```js
{% if title == "homepage" %}
{% include "welcome.njk" %}

{% elif title == "examplePage" %}
{% include "example-component-1.njk" %}
{% include "subfolder/example-component-2.njk" %}

{% else %}
{% include "404/_404.njk" %}
{{ content | safe }}
{% endif %}
```

Add a new `{% elif %}` block for each page, listing its components in order. If a component lives in a subfolder, specify the relative path accordingly

> ⚠️ A new `elif` block is automatically added when you create a page via the Assistant CLI

> ⚠️ If you move or delete a component, always update `page-components.njk` or the site will break

## Nest components

A component can include other components. This is useful for breaking complex sections into smaller, reusable pieces.

### exampleComponent.njk
```js
<section class="hero">
  {% include "hero/hero-title.njk" %}
  {% include "hero/hero-button.njk" %}
</section>
```

> The same path rules apply: if the included component is in a subfolder, specify the full relative path.

## Global components

Header and footer live in `src/frontend/components/global/` and are automatically included in every page via `base.njk`. Edit them to change the site-wide layout

## Site data in components

All values defined in `src/frontend/data/site.json` are globally available in every component via `{{ site.* }}`

### site.json <small>(`src/frontend/data/`)</small>
```json
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
  "privacy": "", // This is supposed to contain a link
  "cookie": "", // This is supposed to contain a link
  "terms": "", // This is supposed to contain a link
  "copyright": {
    "year": "2026",
    "text": "All rights reserved."
  }
```

### Usage in any `.njk` file
```js
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
```js
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

```js
{% for link in test.links %}
  <a href="{{ link.url }}">{{ link.label }}</a>
{% endfor %}
```

Subfolders create nested names: `data/shop/products.json` becomes `{{ shop.products }}`.

> ⚠️ Don't reuse a name that already exists. Another file named `site.json` in a subfolder overwrites the original one silently, with no error to point you at the cause.
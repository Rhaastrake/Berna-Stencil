# Head & SEO

The `<head>` of an HTML page holds the information *about* the page rather than
its content: the title shown in the browser tab, the description search engines
display, the image that appears when someone shares the link. Nibula writes all
of it for you — you just fill in the values.

There are two files to fill in:

- **`src/frontend/data/site.json`** — settings for the whole site
- **`src/frontend/data/pages.json`** — settings for one page at a time

A page uses its own value when it has one, and falls back to the site-wide value
when it doesn't. So filling in `site.json` well means most pages need nothing.

## Site-wide settings

Everything in `site.json` is available anywhere in your templates as
`{{ site.something }}`.

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
  "theme": "dark",
  "theme_color": "#2a2150",
  "logo": "/assets/brand/logo.svg",
  "legal": {
    "privacy": "",
    "cookie": "",
    "terms": "",
    "copyright": {
      "year": "2026",
      "text": "Copyright text"
    }
  }
}
```

| Field | What it's for |
|---|---|
| `site_name` | Your brand or project name |
| `title` | Default page title — used by any page that doesn't set its own |
| `description` | Default description — same idea |
| `keywords` | Default keywords — same idea |
| `domain` / `url` | Used to build full page addresses for search engines and social previews |
| `lang` | The language of your site (`en`, `it`, ...) |
| `author` | Your name |
| `theme` | Colour scheme of the site: `light` or `dark` |
| `theme_color` | Colour of the browser bar on phones — should match your theme |
| `logo` | Path to your logo, also used as the image in social previews |
| `legal.privacy` / `cookie` / `terms` | Addresses of your legal pages — the footer links to them |
| `legal.copyright.year` / `text` | The copyright line in the footer |

## Per-page settings

`pages.json` holds one entry per page, and the assistant creates it for you when
you add a page. Each entry is keyed by the page's `title` from its front matter —
the camelCase one.

```json
{
  "examplePage": {
    "seo": {
      "title": "Example Page",
      "description": "Description",
      "keywords": "",
      "noindex": false,
      "canonical": ""
    },
    "cdn": {
      "css": ["https://example.com/lib.min.css"],
      "js": ["https://example.com/lib.min.js"]
    }
  }
}
```

| Field | What it's for | If you leave it empty |
|---|---|---|
| `seo.title` | The page's title, shown in the browser tab and in search results | Uses the site-wide `title` |
| `seo.description` | The short summary search engines show under the title | Uses the site-wide `description` |
| `seo.keywords` | Keywords for this page | Uses the site-wide `keywords` |
| `seo.noindex` | Set to `true` to ask search engines **not** to list this page | The page can be found normally |
| `seo.canonical` | The one official address of this page, if the same content is reachable at more than one URL | Worked out automatically |
| `cdn.css` / `cdn.js` | Extra stylesheets or scripts loaded from the internet, on this page only | Nothing extra is loaded |

> ⚠️ The assistant fills new entries with placeholder text like `"Description"`.
> Replace it — a page left that way tells search engines and AI crawlers that its
> description is literally "Description".

### How the fallback works

Site-wide values are defaults, not duplicates. You don't need to repeat them per
page. This is what the template actually does:

```njk
{{ pageData.seo.title or title or site.title }}
{{ pageData.seo.description or site.description }}
{{ pageData.seo.keywords or site.keywords }}
```

Read it as: use the page's value; if there isn't one, use the site's.

`noindex` and `canonical` work per-page only — there's no site-wide version,
because "hide the whole site from search" and "one address for the whole site"
aren't things you'd want.

## Theme

One value in `site.json` controls the colour scheme everywhere:

```njk
<html data-theme="{{ site.theme }}" data-bs-theme="{{ site.theme }}">
<meta name="color-scheme" content="{{ site.theme }}">
<meta name="theme-color" content="{{ site.theme_color }}">
```

| What it sets | Why it's there |
|---|---|
| `data-theme` | Your own hook — target it in your SCSS to define theme colours |
| `data-bs-theme` | Bootstrap's dark mode switch. Harmlessly ignored with other frameworks |
| `color-scheme` | Standard CSS — makes scrollbars, form fields and autofill match your theme |
| `theme-color` | The colour of the browser bar on phones |

Keep `theme` and `theme_color` in agreement: a dark theme with a white
`theme_color` gives a white browser bar sitting on top of a dark page.

See the **Styling with SCSS** DOC file for how to hook your own colours to
`data-theme`.

## Favicon

The favicon is the small icon in the browser tab. The three tags are written
directly in `base.njk`. To change the icons, replace the files in
`src/frontend/assets/brand/` **keeping the same names**:

```html
<link rel="icon" type="image/svg+xml" href="{{ '/assets/brand/favicon.svg' | url }}">
<link rel="icon" type="image/png" sizes="32x32" href="{{ '/assets/brand/favicon-32.png' | url }}">
<link rel="apple-touch-icon" sizes="180x180" href="{{ '/assets/brand/apple-touch-icon.png' | url }}">
```

| File | What uses it |
|---|---|
| `favicon.svg` | Modern browsers — scales to any size |
| `favicon-32.png` | Older browsers and some crawlers |
| `apple-touch-icon.png` | The icon iOS uses when someone saves your site to their home screen. Must be 180×180 and **not** transparent — iOS turns transparency into black |

> ⚠️ Without `apple-touch-icon.png`, iOS uses a screenshot of your page as the
> home screen icon instead.

## Where all this is written

Everything above is produced by `src/frontend/layouts/base.njk`, which looks up
the current page's entry like this:

```njk
{% set pageKey = title %}
{% set pageData = pages[pageKey] %}
```

You only need to edit `base.njk` for something the boilerplate doesn't cover — a
web font, an analytics snippet. For everything documented here, change the values
in `site.json` and `pages.json` instead.

> ⚠️ Paths in `base.njk` go through `| url`. That filter makes them work when the
> site is published in a subfolder rather than at the root of a domain — GitHub
> Pages being the common case. Remove it and every stylesheet and script breaks
> there.

## Files for search engines and AI

Three files are generated automatically and published with your site:

| File | What it's for | Reachable at |
|---|---|---|
| `llms.txt` | Describes your site and lists its pages, for AI models | `yoursite.com/llms.txt` |
| `robots.txt` | Tells search engines what they may and may not crawl | `yoursite.com/robots.txt` |
| `sitemap.xml` | Lists your pages so search engines find them all | `yoursite.com/sitemap.xml` |

They are built from templates in `src/frontend/indexing/`. `llms.txt` and
`sitemap.xml` build their page lists the same way: they go through every page and
leave out drafts, the 404 page, and anything marked `noindex`. Creating a page
with the assistant is enough for it to appear in both — there is no list to keep
up to date by hand.

To change the wording or the fixed parts, edit
`src/frontend/indexing/llms.njk` or `src/frontend/indexing/robots.njk`.

> These three files must stay publicly reachable. If you block them in your server
> config, search engines and AI models can't read them.
# Head & SEO

Global settings live in `src/frontend/data/pages.json` and are available everywhere via `{{ pages.* }}`.

## Global fields

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
  "logo": "/assets/brand/logo.svg",
  "legal": {
    "privacy": "",
    "cookie": "",
    "cookieControls": "",
    "terms": "",
    "copyright": {
      "year": "2026",
      "text": "Copyright text"
    }
  }
}
```

| Field | Purpose |
|---|---|
| `site_name` | Brand name (used in meta tags and JSON-LD) |
| `title` | Default page title — fallback when a page has no `seo.title` |
| `description` | Default meta description — fallback for pages |
| `keywords` | Default meta keywords — fallback for pages |
| `domain` / `url` | Canonical URLs, `og:url`, JSON-LD |
| `lang` | HTML `lang` attribute |
| `author` | Meta author and JSON-LD author |
| `theme` | Site color scheme (`light` / `dark`) — sets `data-theme`, `data-bs-theme` and `color-scheme` |
| `theme_color` | Browser UI / PWA bar color — should match the chosen `theme` |
| `logo` | Path to the logo, also used as social image |
| `legal.privacy` / `cookie` / `cookieControls` / `terms` | Legal page URLs |
| `legal.copyright.year` / `text` | Footer copyright |

## Per-page SEO and CDN

Per-page settings live in `src/frontend/data/pages.json`, available via `{{ pages.* }}`. Each page is keyed by its camelCase `title` from the front matter, at the root of the file:

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

| Field | Purpose | If empty / absent |
|---|---|---|
| `seo.title` | Page title | Falls back to global `title` |
| `seo.description` | Meta description | Falls back to global `description` |
| `seo.keywords` | Meta keywords | Falls back to global `keywords` |
| `seo.noindex` | If `true`, emits `<meta name="robots" content="noindex, follow">` and drops the page from the sitemap | Page is indexable |
| `seo.canonical` | Absolute canonical URL override | Computed as `url + page.url` |
| `cdn.css` / `cdn.js` | Extra per-page CDN links | No extra links loaded |

## Fallback logic

Global values are defaults, not duplicates. A page value is used when present; otherwise the global one applies:

```njk
{{ pageData.seo.title or title or site.title }}
{{ pageData.seo.description or site.description }}
{{ pageData.seo.keywords or site.keywords }}
```

`noindex` and `canonical` have no global default: `noindex` defaults to indexable behavior, `canonical` is computed from the URL. They exist per-page only.

## Theme

`theme` is a single fixed value that drives the whole site:

```njk
<html data-theme="{{ site.theme }}" data-bs-theme="{{ site.theme }}">
<meta name="color-scheme" content="{{ site.theme }}">
<meta name="theme-color" content="{{ site.theme_color }}">
```

| Attribute | Purpose |
|---|---|
| `data-theme` | Your own hook — target it in SCSS to define theme variables |
| `data-bs-theme` | Bootstrap's color mode. Ignored (harmless) if you use another framework |
| `color-scheme` | Standard CSS — makes scrollbars, form controls and autofill follow the theme |
| `theme-color` | Color of the browser UI bar on mobile |

Keep `theme` and `theme_color` consistent: a `dark` theme with a white `theme_color` gives a white browser bar over a dark page.

See the SCSS docs for how to hook your variables to `data-theme`.

## Favicon

The three favicon tags are hardcoded in `base.njk`. To change the icons, replace the files in `src/frontend/assets/brand/` keeping the same names:

```html
<link rel="icon" type="image/svg+xml" href="{{ '/assets/brand/favicon.svg' | url }}">
<link rel="icon" type="image/png" sizes="32x32" href="{{ '/assets/brand/favicon-32.png' | url }}">
<link rel="apple-touch-icon" sizes="180x180" href="{{ '/assets/brand/apple-touch-icon.png' | url }}">
```

| File | Purpose |
|---|---|
| `favicon.svg` | Modern browsers, scales to any size |
| `favicon-48.png` | Fallback for older browsers and some crawlers |
| `favicon-32.png` | Fallback for older browsers and some crawlers |
| `apple-touch-icon.png` | iOS home screen icon — 180×180, must be opaque (iOS renders transparency as black) |

> ⚠️ Without `apple-touch-icon.png`, iOS uses a screenshot of the page as the home screen icon.

## AI & SEO bots

`llms.txt`, `robots.txt` and `sitemap.xml` are generated from `.njk` templates and are publicly reachable (they must not be blocked by the server config).

| File | Purpose | Reachable at |
|---|---|---|
| `llms.njk` | Tells AI models what the site is about | `yoursite.com/llms.txt` |
| `robots.njk` | Controls search-engine crawling | `yoursite.com/robots.txt` |
| `sitemap.njk` | Lists indexable pages (skips drafts, 404, and `noindex`) | `yoursite.com/sitemap.xml` |

To customize, edit `src/frontend/llms.njk` or `src/frontend/robots.njk` directly.
# Assistant CLI

> Examples use JavaScript, but everything applies equally to TypeScript. The only difference is the file extension (`.ts` instead of `.js`), that imports do **not** include the extension, and that paths use `src/frontend/ts/` instead of `src/frontend/js/`.

An interactive CLI to manage pages without touching files manually.

Run it from anywhere inside a project:

```
nib cli
```

## Menu

```
1. Create page
2. Remove page
3. Rename page
4. Configure output path
```

Use `CTRL/CMD + C` (or `CTRL + D`) to exit.

## Create page

Enter a page name in any format — the CLI converts it to kebab-case automatically.

For a page named `my-page`, the following files are created:

| File | Purpose |
|---|---|
| `src/frontend/scss/pages/myPage.scss` | SCSS entry point |
| `src/frontend/js/pages/myPage.js` | JS entry point |
| `src/frontend/routes/my-page.njk` | Nunjucks template |

It also adds an `elif` block in `page-components.njk` and a stub entry in `pages.json`:

```json
    "myPage": {
      "seo": {
        "title": "My page",
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

## Remove page

Deletes all source files for the page and cleans up the output directory, `page-components.njk`, and `pages.json`.

## Rename page

Renames all three source files, updates the `elif` block in `page-components.njk`, and renames the record in `pages.json`. Nothing inside the record is touched — your SEO title, description and CDN links stay exactly as you wrote them.

## Configure output path

Updates the output directory across `.eleventy.js` and all relevant `package.json` scripts in one shot. The old output folder is deleted automatically.

> ⚠️ `homepage` and `404` are protected — they cannot be created, removed, or renamed via the CLI.
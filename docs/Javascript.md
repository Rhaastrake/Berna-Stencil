# JavaScript

> Examples use JavaScript, but everything applies equally to TypeScript. The only difference is the file extension (`.ts` instead of `.js`), that imports do **not** include the extension, and that paths use `src/frontend/ts/` instead of `src/frontend/js/`.

## Page JS

Each page has its own JS entry point in `src/frontend/js/pages/`, bundled and minified by esbuild and loaded automatically by `base.njk`.

Import only what the page needs.

### examplePage.js <small>(`src/frontend/js/pages/`)</small>

```js
import '../global.js';

// import { initExampleModule } from '../modules/exampleModule.js';

document.addEventListener("DOMContentLoaded", () => {
    // initExampleModule();
});

// Page logic here
```

## Global JS

Some code has to run on every page: a header menu, a theme toggle, a cookie banner. Repeating it in every page entry point means you'll eventually forget it on one of them, and the bug only shows up on that single page.

That's what `global.js` is for. It lives in `src/frontend/js/`, every page entry point imports it, and it takes care of running the shared modules.

### global.js <small>(`src/frontend/js/`)</small>

```js
// import { initExampleModule } from './exampleModule.js';

function initGlobal() {
    // initExampleModule();
}

// Global logic here

// Do not touch
// This instruction starts global.js itself
document.addEventListener('DOMContentLoaded', initGlobal);
```

Pages import it without curly braces, since there is nothing to export — the module runs on its own as soon as it's part of the bundle:

```js
import '../global.js';
```

Note that the import path inside `global.js` is `'./exampleModule.js'` and not `'../modules/exampleModule.js'`: `global.js` already sits in the modules folder, next to the modules it imports.

### A concrete example: the header menu

A responsive header has a burger button that opens the navigation on small screens. The header is included in `base.njk`, so it's on every page — a textbook case for `global.js`.

Write the behaviour as a normal module:

### header.js <small>(`src/frontend/js/modules/`)</small>
```js
export function initHeader() {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        menu.classList.toggle('is-open');
    });
}
```

Then wire it up once, in `global.js`:

```js
import { initHeader } from './modules/header.js';

function initGlobal() {
    initHeader();
}

// Do not touch
// This instruction starts global.js itself
document.addEventListener('DOMContentLoaded', initGlobal);
```

The burger now works on every page, and no page entry point had to change. Adding another global behaviour later is two lines: one import, one call inside `initGlobal()`.

The early `return` matters: if a page has no header, the module does nothing instead of throwing an error that would stop your other scripts.

### Global or page module?

Use `global.js` for behaviour tied to something present on every page — anything included in `base.njk`, essentially.

Keep it in the page entry point when only one or two pages need it. Everything imported by `global.js` ends up in *every* page bundle, so a heavy module used by a single page belongs in that page instead.

## Modules

Modules live in `src/frontend/js/modules/`. Modules that interact with the DOM must be called inside `DOMContentLoaded`; others can be called anywhere.

## Adding a module

Create a new `.js` file in `src/frontend/js/modules/`. Subfolders are allowed.

Use ESM syntax — esbuild handles the bundling:

### exampleModule.js <small>(`src/frontend/js/modules/`)</small>

```js
export function exampleModule() {
    // Module logic here
}
```

Then import it in the pages that need it:

```js
import { exampleModule } from '../modules/exampleModule.js';
```

In TypeScript, omit the extension:

```ts
import { exampleModule } from '../modules/exampleModule';
```
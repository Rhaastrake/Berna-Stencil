const fs = require('fs');
const path = require('path');
const { PATHS } = require('./constants');
const { isTypeScriptProject } = require('./utils');

const OUTPUT_DIR_REGEX = /const OUTPUT_DIR\s*=\s*['"`]([^'"`]*)['"`]/;
const TSCONFIG_OUTDIR_REGEX = /"outDir"\s*:\s*"[^"]*"/;

const OUT_SCRIPTS = [
    ['build:css', '/css',      'sass src/frontend/scss:{OUT}/css --no-source-map --style=compressed --quiet --load-path=node_modules'],
    ['serve:css', '/css',      'sass --watch src/frontend/scss:{OUT}/css --no-source-map --quiet --load-path=node_modules'],
    ['build:js',  '/js/pages', 'esbuild "{GLOB}" --bundle --outdir={OUT}/js/pages --minify'],
    ['serve:js',  '/js/pages', 'esbuild "{GLOB}" --bundle --outdir={OUT}/js/pages --watch'],
];

function parseOutputDir(content) {
    const match = content.match(OUTPUT_DIR_REGEX);
    return match ? match[1] : null;
}

function isAbsolutePath(p) {
    return path.isAbsolute(p) || /^[a-zA-Z]:/.test(p);
}

function updateEleventyConfig(newPath) {
    const content = fs.readFileSync(PATHS.eleventyConfig, 'utf8');
    const updated = content.replace(OUTPUT_DIR_REGEX, `const OUTPUT_DIR = "${newPath}"`);

    if (content === updated) {
        console.log('[skip] OUTPUT_DIR not found in .eleventy.js');
        return;
    }
    fs.writeFileSync(PATHS.eleventyConfig, updated);
    console.log(`[updated] .eleventy.js → ${newPath}`);
}

function updatePackageJson(newPath, oldPath) {
    const pkg = JSON.parse(fs.readFileSync(PATHS.packageJson, 'utf8'));
    const scriptGlob = isTypeScriptProject()
        ? 'src/frontend/ts/pages/*.ts'
        : 'src/frontend/js/pages/*.js';

    pkg.outputDir = newPath;
    pkg.scripts = pkg.scripts || {};

    for (const [name, suffix, template] of OUT_SCRIPTS) {
        const current = pkg.scripts[name];
        const token = oldPath ? `${oldPath}${suffix}` : null;

        if (current && token && current.includes(token)) {
            pkg.scripts[name] = current.split(token).join(`${newPath}${suffix}`);
        } else {
            pkg.scripts[name] = template
                .replace(/\{OUT\}/g, newPath)
                .replace(/\{GLOB\}/g, scriptGlob);
        }
    }

    fs.writeFileSync(PATHS.packageJson, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log(`[updated] package.json → ${newPath}`);
}

function updateTsConfig(newPath) {
    if (!isTypeScriptProject()) return;

    const outDir = isAbsolutePath(newPath) ? `${newPath}/ts` : `./${newPath}/ts`;
    const content = fs.readFileSync(PATHS.tsconfig, 'utf8');
    const updated = content.replace(TSCONFIG_OUTDIR_REGEX, `"outDir": "${outDir}"`);

    if (content === updated) {
        console.log('[skip] outDir not found in tsconfig.json');
        return;
    }
    fs.writeFileSync(PATHS.tsconfig, updated);
    console.log(`[updated] tsconfig.json → ${outDir}`);
}

function deleteOldOutput(oldPath) {
    if (!oldPath) return;

    const oldAbsPath = path.resolve(PATHS.root, oldPath);
    const insideProject = oldAbsPath.startsWith(PATHS.root + path.sep);

    if (!insideProject || oldAbsPath === PATHS.root) {
        console.log(`[skip] refusing to delete "${oldAbsPath}" (outside project)`);
        return;
    }
    if (fs.existsSync(oldAbsPath)) {
        fs.rmSync(oldAbsPath, { recursive: true, force: true });
        console.log(`[deleted] ${oldAbsPath}`);
    }
}

function updateOutputPath(rawPath) {
    const trimmed = (rawPath ?? '').trim().replace(/\\/g, '/');
    if (!trimmed) {
        console.log('[skip] empty output path');
        return;
    }

    const normalizedPath = trimmed === '.'
        ? 'out'
        : `${trimmed.replace(/\/$/, '')}/${path.basename(PATHS.root)}-out`;

    let oldPath = null;
    try {
        oldPath = parseOutputDir(fs.readFileSync(PATHS.eleventyConfig, 'utf8'));
    } catch (err) {
        console.log(`[error] cannot read .eleventy.js: ${err.message}`);
        return;
    }

    deleteOldOutput(oldPath);

    console.log(`\nupdating output path → "${normalizedPath}"`);
    try {
        updatePackageJson(normalizedPath, oldPath);
        updateEleventyConfig(normalizedPath);
        updateTsConfig(normalizedPath);
    } catch (err) {
        console.log(`[error] could not update output path: ${err.message}`);
    }
}

function getCurrentOutputPath() {
    try {
        return parseOutputDir(fs.readFileSync(PATHS.eleventyConfig, 'utf8'));
    } catch {
        return null;
    }
}

module.exports = { updateOutputPath, getCurrentOutputPath };
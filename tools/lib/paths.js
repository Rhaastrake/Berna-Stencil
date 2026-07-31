const fs = require('fs');
const path = require('path');
const settings = require('../config/settings.json');
const { paint } = require('./colors');
const { message } = require('./logger');

const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');
const PATH_SEPARATOR = '/';
const NOT_INSIDE_PROJECT_MESSAGE = paint('red', message('project.notInside'));

let cachedProjectRoot = null;

function findProjectRoot(start) {
    let directory = path.resolve(start ?? process.cwd());
    while (true) {
        if (fs.existsSync(path.join(directory, settings.project.marker))) return directory;
        const parent = path.dirname(directory);
        if (parent === directory) return null;
        directory = parent;
    }
}

function projectRoot() {
    if (cachedProjectRoot) return cachedProjectRoot;
    const root = findProjectRoot();
    if (!root) {
        console.error(NOT_INSIDE_PROJECT_MESSAGE);
        process.exit(1);
    }
    cachedProjectRoot = root;
    return root;
}

function resolveFromProject(relativePath) {
    return path.join(projectRoot(), ...relativePath.split(PATH_SEPARATOR));
}

function resolveFromPackage(relativePath) {
    return path.join(PACKAGE_ROOT, ...relativePath.split(PATH_SEPARATOR));
}

const PATHS = Object.freeze({
    get root()             { return projectRoot(); },
    get eleventyConfig()   { return resolveFromProject(settings.paths.eleventyConfig); },
    get packageJson()      { return resolveFromProject(settings.paths.packageJson); },
    get typescriptConfig() { return resolveFromProject(settings.paths.typescriptConfig); },
    get routes()           { return resolveFromProject(settings.paths.routes); },
    get stylePages()       { return resolveFromProject(settings.paths.stylePages); },
    get siteData()         { return resolveFromProject(settings.paths.siteData); },
    get pageComponents()   { return resolveFromProject(settings.paths.pageComponents); },
    get templates()        { return resolveFromPackage(settings.paths.templates); },
});

module.exports = {
    PATHS,
    PACKAGE_ROOT,
    NOT_INSIDE_PROJECT_MESSAGE,
    findProjectRoot,
    resolveFromProject,
    resolveFromPackage,
};

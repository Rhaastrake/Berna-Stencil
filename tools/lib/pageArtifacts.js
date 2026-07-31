const path = require('path');
const settings = require('../config/settings.json');
const { PATHS } = require('./paths');
const { exists } = require('./files');
const { languageSettings, scriptPagesDirectory } = require('./project');
const { getCurrentOutputPath } = require('./outputPath');
const { toCamelCase, formatText } = require('./text');

const PATH_SEPARATOR = '/';

function outputRoot() {
    return path.join(PATHS.root, getCurrentOutputPath() || settings.project.defaultOutputDirectory);
}

function resolveOutput(root, template, values) {
    return path.join(root, ...formatText(template, values).split(PATH_SEPARATOR));
}

function routeFile(pageName) {
    return path.join(PATHS.routes, `${pageName}.${settings.page.routeExtension}`);
}

function pageExists(pageName) {
    return exists(routeFile(pageName));
}

function getPageArtifacts(pageName) {
    const camelName = toCamelCase(pageName);
    const values = { camelName, pageName };
    const root = outputRoot();

    return {
        camelName,
        source: {
            style:  path.join(PATHS.stylePages, `${camelName}.${settings.page.styleExtension}`),
            script: path.join(scriptPagesDirectory(), `${camelName}.${languageSettings().extension}`),
            route:  routeFile(pageName),
        },
        output: {
            files:       settings.page.outputFiles.map((template) => resolveOutput(root, template, values)),
            directories: settings.page.outputDirectories.map((template) => resolveOutput(root, template, values)),
        },
    };
}

module.exports = { getPageArtifacts, pageExists };

const path = require('path');
const settings = require('../config/settings.json');
const { PATHS } = require('./paths');
const { exists } = require('./files');
const { languageSettings, scriptPagesDirectory } = require('./project');
const { toCamelCase } = require('./text');

function routeFile(pageName) {
    return path.join(PATHS.routes, `${pageName}.${settings.page.routeExtension}`);
}

function pageExists(pageName) {
    return exists(routeFile(pageName));
}

function getPageArtifacts(pageName) {
    const camelName = toCamelCase(pageName);

    return {
        camelName,
        source: {
            style:  path.join(PATHS.stylePages, `${camelName}.${settings.page.styleExtension}`),
            script: path.join(scriptPagesDirectory(), `${camelName}.${languageSettings().extension}`),
            route:  routeFile(pageName),
        },
    };
}

module.exports = { getPageArtifacts, pageExists };
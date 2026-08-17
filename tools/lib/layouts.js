const settings = require('../config/settings.json');
const { PATHS } = require('./paths');
const { exists, readDirectory } = require('./files');

const LAYOUT_SUFFIX = `.${settings.page.layoutExtension}`;

function availableLayouts() {
    if (!exists(PATHS.layouts)) return [];

    return readDirectory(PATHS.layouts)
        .filter((name) => name.endsWith(LAYOUT_SUFFIX))
        .sort();
}

module.exports = { availableLayouts };
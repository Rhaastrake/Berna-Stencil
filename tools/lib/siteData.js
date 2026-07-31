const path = require('path');
const settings = require('../config/settings.json');
const { PATHS } = require('./paths');
const { exists, readText, writeJson } = require('./files');
const { log } = require('./logger');
const { toCamelCase, toTitleCase, formatValue } = require('./text');

const PAGES_KEY = settings.page.dataKeys.pages;
const SEO_KEY = settings.page.dataKeys.seo;
const TITLE_KEY = settings.page.dataKeys.title;

function readSiteData() {
    if (!exists(PATHS.siteData)) {
        log('siteData.fileMissing', { path: PATHS.siteData });
        return null;
    }
    try {
        const data = JSON.parse(readText(PATHS.siteData));
        if (!data[PAGES_KEY] || typeof data[PAGES_KEY] !== 'object') data[PAGES_KEY] = {};
        return data;
    } catch (error) {
        log('siteData.parseFailed', { file: path.basename(PATHS.siteData), error: error.message });
        return null;
    }
}

function writeSiteData(data) {
    writeJson(PATHS.siteData, data);
}

function createRecord(pageName) {
    return formatValue(settings.page.defaultData, { title: toTitleCase(pageName) });
}

function addSiteData(pageName) {
    const data = readSiteData();
    if (!data) return;

    const camelName = toCamelCase(pageName);
    if (data[PAGES_KEY][camelName]) {
        log('siteData.recordExists', { name: camelName });
        return;
    }

    data[PAGES_KEY][camelName] = createRecord(pageName);

    writeSiteData(data);
    log('siteData.recordAdded', { name: camelName });
}

function removeSiteData(pageName) {
    const data = readSiteData();
    if (!data) return;

    const camelName = toCamelCase(pageName);
    if (!data[PAGES_KEY][camelName]) {
        log('siteData.recordMissing', { name: camelName });
        return;
    }

    delete data[PAGES_KEY][camelName];
    writeSiteData(data);
    log('siteData.recordRemoved', { name: camelName });
}

function renameSiteData(oldName, newName) {
    const data = readSiteData();
    if (!data) return;

    const oldCamelName = toCamelCase(oldName);
    const newCamelName = toCamelCase(newName);

    if (!data[PAGES_KEY][oldCamelName]) {
        log('siteData.recordMissing', { name: oldCamelName });
        return;
    }
    if (data[PAGES_KEY][newCamelName]) {
        log('siteData.recordExists', { name: newCamelName });
        return;
    }

    const record = data[PAGES_KEY][oldCamelName];
    data[PAGES_KEY][newCamelName] = {
        ...record,
        [SEO_KEY]: { ...record[SEO_KEY], [TITLE_KEY]: toTitleCase(newName) },
    };
    delete data[PAGES_KEY][oldCamelName];

    writeSiteData(data);
    log('siteData.recordRenamed', { source: oldCamelName, destination: newCamelName });
}

module.exports = { addSiteData, removeSiteData, renameSiteData };

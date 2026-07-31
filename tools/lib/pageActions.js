const path = require('path');
const settings = require('../config/settings.json');
const { PATHS } = require('./paths');
const { exists, readText, writeText, copyFile, moveFile, removeFile, removeDirectory } = require('./files');
const { log } = require('./logger');
const { formatText } = require('./text');
const { languageSettings } = require('./project');
const { getPageArtifacts, pageExists } = require('./pageArtifacts');
const { addSiteData, removeSiteData, renameSiteData } = require('./siteData');
const { addPageBlock, removePageBlock, renamePageBlock } = require('./pageComponents');

const FRONT_MATTER_PATTERNS = Object.freeze({
    title:     /^title:.*$/m,
    permalink: /^permalink:.*$/m,
});

function templatePath(name) {
    return path.join(PATHS.templates, name);
}

function applyFrontMatter(filePath, values) {
    let content = readText(filePath);

    for (const [key, pattern] of Object.entries(FRONT_MATTER_PATTERNS)) {
        content = content.replace(pattern, formatText(settings.frontMatter[key], values));
    }

    writeText(filePath, content);
}

function addPage(pageName) {
    if (pageExists(pageName)) {
        log('page.alreadyExists', { name: pageName });
        return;
    }

    const { camelName, source } = getPageArtifacts(pageName);
    const values = { camelName, pageName };

    const creations = [
        { destination: source.style,  template: settings.page.styleTemplate,  isRoute: false },
        { destination: source.script, template: languageSettings().template,  isRoute: false },
        { destination: source.route,  template: settings.page.routeTemplate,  isRoute: true  },
    ];

    try {
        for (const { destination, template, isRoute } of creations) {
            const templateFile = templatePath(template);

            if (!exists(templateFile)) {
                log('page.templateMissing', { path: templateFile });
                continue;
            }

            copyFile(templateFile, destination);
            if (isRoute) applyFrontMatter(destination, values);

            log('page.fileCreated', { path: destination });
        }
    } catch (error) {
        log('page.createFailed', { error: error.message });
        return;
    }

    addPageBlock(pageName);
    addSiteData(pageName);
}

function renamePage(oldName, newName) {
    if (!pageExists(oldName)) {
        log('page.doesNotExist', { name: oldName });
        return;
    }
    if (pageExists(newName)) {
        log('page.targetExists', { name: newName });
        return;
    }

    const current = getPageArtifacts(oldName);
    const next = getPageArtifacts(newName);
    const values = { camelName: next.camelName, pageName: newName };

    const moves = [
        { source: current.source.style,  destination: next.source.style,  isRoute: false },
        { source: current.source.script, destination: next.source.script, isRoute: false },
        { source: current.source.route,  destination: next.source.route,  isRoute: true  },
    ];

    try {
        for (const { source, destination, isRoute } of moves) {
            if (!exists(source)) {
                log('page.fileMissing', { path: source });
                continue;
            }

            moveFile(source, destination);
            log('page.fileRenamed', { source, destination });

            if (isRoute) applyFrontMatter(destination, values);
        }
    } catch (error) {
        log('page.renameFailed', { error: error.message });
        return;
    }

    renamePageBlock(oldName, newName);
    renameSiteData(oldName, newName);
}

function removePage(pageName) {
    if (!pageExists(pageName)) {
        log('page.doesNotExist', { name: pageName });
    }

    const { source, output } = getPageArtifacts(pageName);
    const files = [source.style, source.script, source.route, ...output.files];

    for (const file of files) {
        try {
            if (removeFile(file)) log('page.fileDeleted', { path: file });
        } catch (error) {
            log('page.deleteFailed', { path: file, error: error.message });
        }
    }

    for (const directory of output.directories) {
        try {
            if (removeDirectory(directory)) log('page.fileDeleted', { path: directory });
        } catch (error) {
            log('page.deleteFailed', { path: directory, error: error.message });
        }
    }

    removePageBlock(pageName);
    removeSiteData(pageName);
}

module.exports = { addPage, removePage, renamePage };

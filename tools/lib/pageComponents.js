const path = require('path');
const settings = require('../config/settings.json');
const { PATHS } = require('./paths');
const { exists, readText, writeText } = require('./files');
const { log } = require('./logger');
const { toCamelCase, formatText } = require('./text');

const EXTRA_BLANK_LINES_PATTERN = /\n\s*\n\s*\n/g;
const BLANK_LINES = '\n\n';
const ANCHOR = settings.pageComponents.anchor;

function blockPattern(camelName) {
    return new RegExp(
        `[ \\t]*\\{%\\s*elif\\s+title\\s*==\\s*"${camelName}"\\s*%\\}[\\s\\S]*?(?=[ \\t]*\\{%\\s*(?:elif|else|endif))`
    );
}

function conditionFor(camelName) {
    return formatText(settings.pageComponents.condition, { camelName });
}

function readPageComponents() {
    if (!exists(PATHS.pageComponents)) {
        log('components.fileMissing', { path: PATHS.pageComponents });
        return null;
    }
    return readText(PATHS.pageComponents);
}

function writePageComponents(content) {
    writeText(PATHS.pageComponents, content);
}

function addPageBlock(pageName) {
    const content = readPageComponents();
    if (content === null) return;

    const camelName = toCamelCase(pageName);
    const condition = conditionFor(camelName);
    if (content.includes(condition)) return;

    if (!content.includes(ANCHOR)) {
        log('components.anchorMissing', { anchor: ANCHOR, file: path.basename(PATHS.pageComponents) });
        return;
    }

    const block = `${condition}\n${settings.pageComponents.include}\n\n`;

    writePageComponents(content.replace(ANCHOR, `${block}${ANCHOR}`));
    log('components.blockAdded', { name: camelName });
}

function removePageBlock(pageName) {
    const content = readPageComponents();
    if (content === null) return;

    const camelName = toCamelCase(pageName);
    if (!blockPattern(camelName).test(content)) {
        log('components.blockMissing', { name: camelName });
        return;
    }

    const updated = content
        .replace(blockPattern(camelName), '')
        .replace(EXTRA_BLANK_LINES_PATTERN, BLANK_LINES);

    writePageComponents(updated);
    log('components.blockRemoved', { name: camelName });
}

function renamePageBlock(oldName, newName) {
    const content = readPageComponents();
    if (content === null) return;

    const oldCamelName = toCamelCase(oldName);
    const newCamelName = toCamelCase(newName);
    const oldCondition = conditionFor(oldCamelName);

    if (!content.includes(oldCondition)) {
        log('components.blockMissing', { name: oldCamelName });
        return;
    }

    writePageComponents(content.replace(oldCondition, conditionFor(newCamelName)));
    log('components.blockRenamed', { source: oldCamelName, destination: newCamelName });
}

module.exports = { addPageBlock, removePageBlock, renamePageBlock };

const fs = require('fs');
const settings = require('../config/settings.json');
const { PATHS, resolveFromProject } = require('./paths');
const { readJson, writeJson } = require('./files');

const JAVASCRIPT = 'javascript';
const TYPESCRIPT = 'typescript';
const ENTRY_WILDCARD = '*';

function isTypeScriptProject() {
    return fs.existsSync(PATHS.typescriptConfig);
}

function currentLanguage() {
    return isTypeScriptProject() ? TYPESCRIPT : JAVASCRIPT;
}

function languageSettings(language) {
    return settings.languages[language ?? currentLanguage()];
}

function scriptPagesDirectory(language) {
    return resolveFromProject(languageSettings(language).pages);
}

function scriptEntries(language) {
    const { pages, extension } = languageSettings(language);
    return `${pages}/${ENTRY_WILDCARD}.${extension}`;
}

function allScriptEntries() {
    return Object.keys(settings.languages).map((language) => scriptEntries(language));
}

function readPackageJson() {
    return readJson(PATHS.packageJson);
}

function writePackageJson(content) {
    writeJson(PATHS.packageJson, content);
}

module.exports = {
    JAVASCRIPT,
    TYPESCRIPT,
    isTypeScriptProject,
    currentLanguage,
    languageSettings,
    scriptPagesDirectory,
    scriptEntries,
    allScriptEntries,
    readPackageJson,
    writePackageJson,
};

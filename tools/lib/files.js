const fs = require('fs');
const path = require('path');

const ENCODING = 'utf8';
const INDENTATION = 2;
const NEW_LINE = '\n';

function exists(target) {
    return fs.existsSync(target);
}

function ensureDirectory(target) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
}

function readText(target) {
    return fs.readFileSync(target, ENCODING);
}

function writeText(target, content) {
    ensureDirectory(target);
    fs.writeFileSync(target, content);
}

function readJson(target) {
    return JSON.parse(readText(target));
}

function writeJson(target, data) {
    writeText(target, `${JSON.stringify(data, null, INDENTATION)}${NEW_LINE}`);
}

function copyFile(source, destination) {
    ensureDirectory(destination);
    fs.copyFileSync(source, destination);
}

function moveFile(source, destination) {
    ensureDirectory(destination);
    fs.renameSync(source, destination);
}

function removeFile(target) {
    if (!exists(target)) return false;
    fs.unlinkSync(target);
    return true;
}

function removeDirectory(target) {
    if (!exists(target)) return false;
    fs.rmSync(target, { recursive: true, force: true });
    return true;
}

module.exports = {
    exists,
    readText,
    writeText,
    readJson,
    writeJson,
    copyFile,
    moveFile,
    removeFile,
    removeDirectory,
};

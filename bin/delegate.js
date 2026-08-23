const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_NAME = 'nibula';
const NODE_MODULES = 'node_modules';
const ENTRY_FILE = path.join('bin', 'nibula.js');
const PACKAGE_FILE = 'package.json';
const LOCAL_FLAG = 'NIBULA_LOCAL';
const LOCAL_FLAG_VALUE = '1';
const GLOBAL_VERSION_FLAG = 'NIBULA_GLOBAL_VERSION';

const globalVersion = require(`../${PACKAGE_FILE}`).version;

function realPath(target) {
    try {
        return fs.realpathSync(target);
    } catch {
        return null;
    }
}

function delegateToLocal(projectRoot) {
    if (process.env[LOCAL_FLAG] === LOCAL_FLAG_VALUE) return;

    const localRoot = realPath(path.join(projectRoot, NODE_MODULES, PACKAGE_NAME));
    const selfRoot = realPath(path.join(__dirname, '..'));

    if (!localRoot || localRoot === selfRoot) return;

    const localEntry = path.join(localRoot, ENTRY_FILE);
    if (!fs.existsSync(localEntry)) return;

    const result = spawnSync(process.execPath, [localEntry, ...process.argv.slice(2)], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, [LOCAL_FLAG]: LOCAL_FLAG_VALUE, [GLOBAL_VERSION_FLAG]: globalVersion },
    });

    process.exit(result.status ?? 0);
}

module.exports = { delegateToLocal };
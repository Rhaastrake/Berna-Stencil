const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { color } = require('../tools/lib/colors');
const { message } = require('../tools/lib/logger');

const PACKAGE_NAME = 'nibula';
const NODE_MODULES = 'node_modules';
const ENTRY_FILE = path.join('bin', 'nibula.js');
const PACKAGE_FILE = 'package.json';
const LOCAL_FLAG = 'NIBULA_LOCAL';
const LOCAL_FLAG_VALUE = '1';

const globalVersion = require(`../${PACKAGE_FILE}`).version;

function realPath(target) {
    try {
        return fs.realpathSync(target);
    } catch {
        return null;
    }
}

function readVersion(packageRoot) {
    try {
        return JSON.parse(fs.readFileSync(path.join(packageRoot, PACKAGE_FILE), 'utf8')).version;
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

    const localVersion = readVersion(localRoot);

    if (localVersion && localVersion !== globalVersion) {
        console.log(`${color.dim}${message('cli.usingLocalVersion', { local: localVersion, global: globalVersion })}${color.reset}`);
    }

    const result = spawnSync(process.execPath, [localEntry, ...process.argv.slice(2)], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, [LOCAL_FLAG]: LOCAL_FLAG_VALUE },
    });

    process.exit(result.status ?? 0);
}

module.exports = { delegateToLocal };
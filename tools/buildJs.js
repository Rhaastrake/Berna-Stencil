const path = require('path');
const esbuild = require('esbuild');
const glob = require('glob');
const settings = require('./config/settings.json');
const { PATHS } = require('./lib/paths');
const { readPackageJson, allScriptEntries } = require('./lib/project');

const WATCH_FLAG = '--watch';
const PATH_SEPARATOR = '/';

function toPosix(target) {
    return target.split(path.sep).join(PATH_SEPARATOR);
}

function collectEntryPoints() {
    return allScriptEntries().flatMap((entries) => glob.sync(toPosix(path.join(PATHS.root, entries))));
}

const packageJson = readPackageJson();
const outputDirectory = packageJson[settings.packageJson.outputKey] || settings.project.defaultOutputDirectory;
const watch = process.argv.includes(WATCH_FLAG);
const entryPoints = collectEntryPoints();

if (entryPoints.length === 0) {
    process.exit(0);
}

const options = {
    entryPoints,
    bundle: true,
    outdir: path.join(PATHS.root, outputDirectory, ...settings.build.scriptOutput.split(PATH_SEPARATOR)),
    minify: !watch,
};

if (watch) {
    esbuild.context(options).then((context) => context.watch()).catch(() => process.exit(1));
} else {
    esbuild.build(options).catch(() => process.exit(1));
}

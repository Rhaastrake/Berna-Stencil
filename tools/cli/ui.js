const settings = require('../config/settings.json');
const { color } = require('../lib/colors');
const { message } = require('../lib/logger');

const SYMBOLS = settings.cli.symbols;
const COLORS = settings.cli.colors;
const MENU = settings.cli.menu;
const BOX_WIDTH = settings.cli.boxWidth;
const BOX_TITLE = settings.cli.title;
const BOX_TOP_LEFT = '\u256d';
const BOX_TOP_RIGHT = '\u256e';
const BOX_BOTTOM_LEFT = '\u2570';
const BOX_BOTTOM_RIGHT = '\u256f';
const BOX_HORIZONTAL = '\u2500';
const BOX_VERTICAL = '\u2502';
const NEW_LINE = '\n';
const SPACE = ' ';

function line(colorName, text) {
    return `${color[colorName]}${text}${color.reset}`;
}

function promptLine(text, prefix = NEW_LINE) {
    return `${prefix}${line(COLORS.prompt, SYMBOLS.prompt)} ${text}`;
}

function error(text) {
    console.log(`${NEW_LINE}${line(COLORS.error, `${SYMBOLS.error} ${text}`)}`);
}

function warning(text) {
    console.log(`${NEW_LINE}${line(COLORS.warning, `${SYMBOLS.warning} ${text}`)}`);
}

function notice(text) {
    console.log(`${NEW_LINE}${line(COLORS.notice, text)}`);
}

function noticePrefix(text) {
    return `${NEW_LINE}${line(COLORS.notice, text)}${NEW_LINE}`;
}

function centeredTitle() {
    const padding = BOX_WIDTH - BOX_TITLE.length;
    const left = SPACE.repeat(Math.ceil(padding / 2));
    const right = SPACE.repeat(Math.floor(padding / 2));
    return `${left}${BOX_TITLE}${right}`;
}

function renderMenu() {
    const border = BOX_HORIZONTAL.repeat(BOX_WIDTH);

    console.log(`${NEW_LINE}${color[COLORS.box]}${color.bold}${BOX_TOP_LEFT}${border}${BOX_TOP_RIGHT}`);
    console.log(`${BOX_VERTICAL}${centeredTitle()}${BOX_VERTICAL}`);
    console.log(`${BOX_BOTTOM_LEFT}${border}${BOX_BOTTOM_RIGHT}${color.reset}${NEW_LINE}`);

    for (const item of MENU) {
        console.log(`  ${line(COLORS.menuKey, `${item.key}.`)} ${item.label}`);
    }

    console.log(`${NEW_LINE}${line(COLORS.notice, message('cli.exitHint'))}${NEW_LINE}`);
}

function renderMissingFiles(items) {
    console.log(`${NEW_LINE}${line(COLORS.error, `${SYMBOLS.error} ${message('cli.missingFiles')}`)}`);

    for (const item of items) {
        console.log(`  ${line(COLORS.error, SYMBOLS.bullet)} ${item.label}`);
    }

    console.log(`${NEW_LINE}${line(COLORS.notice, message('cli.incompleteProject'))}`);
}

module.exports = { promptLine, noticePrefix, error, warning, notice, renderMenu, renderMissingFiles };
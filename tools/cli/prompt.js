const readline = require('readline');
const settings = require('../config/settings.json');
const { color, paint } = require('../lib/colors');

const CONTROL_CHARACTERS_PATTERN = /[\x00-\x1F\x7F]/g;
const AFFIRMATIVE_PATTERN = /^y(es)?$/i;
const CONFIRM_HINT = settings.cli.confirmHint;
const EMPTY = '';
const NEW_LINE = '\n';

const CURSOR_UP_PREFIX = '\x1B[';
const CURSOR_UP_SUFFIX = 'A';
const CLEAR_LINE = '\x1B[K';
const CHOICE_INDENT = '  ';

const SELECTED_SYMBOL = settings.cli.symbols.selected;
const UNSELECTED_SYMBOL = settings.cli.symbols.unselected;
const SELECTED_COLOR = settings.cli.colors.selected;

const EXIT_KEYS = ['c', 'd'];
const UP_KEY = 'up';
const DOWN_KEY = 'down';
const CONFIRM_KEYS = ['return', 'enter'];

let activeInterface = null;

function sanitizeInput(value) {
    return (value ?? EMPTY).replace(CONTROL_CHARACTERS_PATTERN, EMPTY).trim();
}

function cursorUp(lines) {
    return `${CURSOR_UP_PREFIX}${lines}${CURSOR_UP_SUFFIX}`;
}

function ask(prompt) {
    return new Promise((resolve) => {
        const readlineInterface = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        });

        activeInterface = readlineInterface;
        let settled = false;

        const finish = (value) => {
            if (settled) return;
            settled = true;
            activeInterface = null;
            readlineInterface.close();
            resolve(value);
        };

        readlineInterface.on('close', () => finish(null));
        readlineInterface.question(prompt, (answer) => finish(sanitizeInput(answer)));
    });
}

async function confirm(prompt) {
    const answer = await ask(`${prompt} ${color.dim}${CONFIRM_HINT}${color.reset} `);
    return AFFIRMATIVE_PATTERN.test((answer ?? EMPTY).trim());
}

function askChoice(prompt, choices) {
    return new Promise((resolve) => {
        let selectedIndex = 0;
        let settled = false;

        process.stdout.write(`${prompt}${NEW_LINE}${NEW_LINE}`);

        const render = (firstRender) => {
            if (!firstRender) process.stdout.write(cursorUp(choices.length));

            const output = choices.map((choice, index) => {
                const selected = index === selectedIndex;
                const symbol = selected ? SELECTED_SYMBOL : UNSELECTED_SYMBOL;
                const label = `${CHOICE_INDENT}${symbol} ${choice.label}`;
                const line = selected ? paint(SELECTED_COLOR, label) : label;
                return `${line}${CLEAR_LINE}${NEW_LINE}`;
            }).join(EMPTY);

            process.stdout.write(output);
        };

        const finish = (value) => {
            if (settled) return;
            settled = true;
            process.stdin.removeListener('keypress', onKeyPress);
            if (process.stdin.isTTY) process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve(value);
        };

        function onKeyPress(character, key) {
            if (key.ctrl && EXIT_KEYS.includes(key.name)) {
                finish(null);
                return;
            }
            if (key.name === UP_KEY) {
                selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : choices.length - 1;
                render(false);
                return;
            }
            if (key.name === DOWN_KEY) {
                selectedIndex = selectedIndex < choices.length - 1 ? selectedIndex + 1 : 0;
                render(false);
                return;
            }
            if (CONFIRM_KEYS.includes(key.name)) {
                finish(choices[selectedIndex].value);
            }
        }

        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('keypress', onKeyPress);
        render(true);
    });
}

function close() {
    if (activeInterface) activeInterface.close();
}

module.exports = { ask, confirm, askChoice, close };
const readline = require('readline');
const settings = require('../config/settings.json');
const { color } = require('../lib/colors');

const CONTROL_CHARACTERS_PATTERN = /[\x00-\x1F\x7F]/g;
const AFFIRMATIVE_PATTERN = /^y(es)?$/i;
const CONFIRM_HINT = settings.cli.confirmHint;
const EMPTY = '';

const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
});

function sanitizeInput(value) {
    return (value ?? EMPTY).replace(CONTROL_CHARACTERS_PATTERN, EMPTY).trim();
}

function ask(prompt) {
    return new Promise((resolve) => {
        const onClose = () => resolve(null);
        readlineInterface.once('close', onClose);
        readlineInterface.question(prompt, (answer) => {
            readlineInterface.off('close', onClose);
            resolve(sanitizeInput(answer));
        });
    });
}

async function confirm(prompt) {
    const answer = await ask(`${prompt} ${color.dim}${CONFIRM_HINT}${color.reset} `);
    return AFFIRMATIVE_PATTERN.test((answer ?? EMPTY).trim());
}

function close() {
    readlineInterface.close();
}

module.exports = { ask, confirm, close };

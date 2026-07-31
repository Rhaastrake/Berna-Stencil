const messages = require('../config/messages.json');
const { formatText } = require('./text');

const KEY_SEPARATOR = '.';

function resolveTemplate(key) {
    return key.split(KEY_SEPARATOR).reduce(
        (current, part) => (current !== null && typeof current === 'object' ? current[part] : undefined),
        messages
    );
}

function message(key, values) {
    const template = resolveTemplate(key);
    return typeof template === 'string' ? formatText(template, values) : key;
}

function log(key, values) {
    console.log(message(key, values));
}

module.exports = { message, log };

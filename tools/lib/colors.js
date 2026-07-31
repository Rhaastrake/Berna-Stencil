const color = Object.freeze({
    reset:   '\x1b[0m',
    bold:    '\x1b[1m',
    dim:     '\x1b[2m',
    red:     '\x1b[31m',
    green:   '\x1b[32m',
    yellow:  '\x1b[33m',
    blue:    '\x1b[34m',
    magenta: '\x1b[35m',
    cyan:    '\x1b[36m',
});

function paint(name, text) {
    return `${color[name] ?? ''}${text}${color.reset}`;
}

module.exports = { color, paint };

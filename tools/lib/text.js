const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;
const CAMEL_SEPARATOR_PATTERN = /[-_][a-z0-9]/g;
const INVALID_KEBAB_PATTERN = /[^a-z0-9\s_-]/g;
const KEBAB_SEPARATOR_PATTERN = /[\s_]+/g;
const REPEATED_HYPHEN_PATTERN = /-+/g;
const EDGE_HYPHEN_PATTERN = /^-+|-+$/g;
const WORD_SEPARATOR = '-';
const SPACE = ' ';
const EMPTY = '';

function formatText(template, values = {}) {
    return String(template).replace(PLACEHOLDER_PATTERN, (match, key) =>
        Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
    );
}

function formatValue(value, values = {}) {
    if (typeof value === 'string') return formatText(value, values);
    if (Array.isArray(value)) return value.map((item) => formatValue(item, values));
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, formatValue(item, values)])
        );
    }
    return value;
}

function toCamelCase(value) {
    return value.toLowerCase().replace(CAMEL_SEPARATOR_PATTERN, (group) => group.slice(1).toUpperCase());
}

function toKebabCase(value) {
    return value.trim().toLowerCase()
        .replace(INVALID_KEBAB_PATTERN, EMPTY)
        .replace(KEBAB_SEPARATOR_PATTERN, WORD_SEPARATOR)
        .replace(REPEATED_HYPHEN_PATTERN, WORD_SEPARATOR)
        .replace(EDGE_HYPHEN_PATTERN, EMPTY);
}

function toTitleCase(value) {
    return value.split(WORD_SEPARATOR)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(SPACE);
}

module.exports = { formatText, formatValue, toCamelCase, toKebabCase, toTitleCase };

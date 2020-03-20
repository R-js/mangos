'use strict';

module.exports = function formatPath(tokens) {
    if (tokens.length === 0) return '';
    return tokens.map(t => t.value).join('');
}

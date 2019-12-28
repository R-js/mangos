module.exports = function sanitizeFileName(name) {
    return name.replace(/[\0?*+]/g, '_');
}

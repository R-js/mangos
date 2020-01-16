module.exports = function isLenZero(data) {
    if (Array.isArray(data) && data.length === 0) {
        return true;
    }
    if (data === '') {
        return true;
    }
    return false;
}
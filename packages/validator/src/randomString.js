const alphabet = Array.from({ length: 26 }).map((_, i) => String.fromCharCode(65 + i));

module.exports = function randomString(length = 4) {
    const _alphabet = alphabet.slice();
    for (let i = 0; i < 26 - length; i++) {
        const idx = Math.trunc(Math.random() * _alphabet.length);
        _alphabet.splice(idx, 1);
    }
    return _alphabet;
};



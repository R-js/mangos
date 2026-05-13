export function validSep(s: string | undefined) {
    return s === '\\' || s === '/';
}

export function getCWD() {
    if (globalThis?.process) {
        return global.process.cwd();
    }
    if (globalThis?.location?.pathname) {
        return globalThis.location.pathname;
    }
    return '/';
}

export function getDrive(str: string): [string, string] {
    const [a, b] = str.slice(0, 2).toLowerCase().split('');
    return [a, b];
}

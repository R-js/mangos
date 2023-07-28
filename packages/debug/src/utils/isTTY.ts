export default function isTTY() {
    if (typeof process?.stdout?.isTTY === 'boolean') {
        return process.stdout.isTTY;
    }
    return false;
}

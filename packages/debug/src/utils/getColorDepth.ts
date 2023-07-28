export default function getColorDepth(): number {
    if (typeof process?.stdout?.getColorDepth === 'function') {
        return process.stdout.getColorDepth();
    }
    return 24;
}

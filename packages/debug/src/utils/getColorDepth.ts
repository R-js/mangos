export default function getColorDepth() {
  if (typeof process?.stdout?.getColorDepth === 'function') {
    return process.stdout.getColorDepth();
  }
  return 24;
}

export default function isTTY() {
  if (process?.stdout?.isTTY !== undefined) {
    return process?.stdout?.isTTY;
  }
  return true;
}

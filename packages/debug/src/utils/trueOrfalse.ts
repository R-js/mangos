export default function trueOrFalse(
  data: string | null | undefined,
  defValue: boolean,
) {
  if (typeof data !== 'string') {
    return defValue;
  }
  if (['false', 'f'].includes(data.toLowerCase())) {
    return false;
  }
  // explicit true
  else if (['true', 't'].includes(data.toLowerCase())) {
    return true;
  }
  return defValue;
}

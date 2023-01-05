export default function isBrowser(): boolean {
  // firefox, chrome, Microsoft Edge
  return 'Window' === Object.getPrototypeOf(globalThis).constructor.name;
}

export default function isNSSelected(
  ns: string | null | undefined,
  pattern: string | null | undefined,
): boolean {
  if (
    typeof ns !== 'string' ||
    typeof pattern !== 'string' ||
    ns.trim() === '' ||
    pattern.trim() === ''
  ) {
    return false;
  }

  let enabled = false;

  const expressions = pattern
    .split(',')
    .map((t) => t.trim())
    .filter((f) => !!f);

  for (const expr of expressions) {
    let not = 0;
    // from the more general to the more specific
    //match everything
    if (expr === '*') {
      enabled = true;
      continue;
    }
    // be more selective
    if (expr.startsWith('-')) {
      not = 1;
    }
    const match1 = expr.slice(not).match(/^(?<prefix>[^*]+)\*$/); // "*" prefixed with some text
    if (match1) {
      const prefix = match1.groups?.prefix as string;
      if (ns.startsWith(prefix)) {
        enabled = not === 0 ? true : false; // only a match can (re)set it to explicit false if there is an explicit "NOT" used
        continue;
      }
    }

    const match2 = expr.slice(not).match(/^\*(?<suffix>[^*]+)$/); // "*" suffixed with some text
    if (match2) {
      const suffix = match2.groups?.suffix as string;
      if (ns.endsWith(suffix)) {
        enabled = not === 0 ? true : false; // only a match can (re)set it to explicit false if there is an explicit "NOT" used
        continue;
      }
    }

    if (expr.slice(not) === ns) {
      enabled = not === 0 ? true : false;
    }
  }
  return enabled;
}

import ms from 'ms';

export function addDate(time = Date.now()) {
  return new Date(time).toISOString();
}

export function addTimeDiff(timeDiff: number) {
  return ms(timeDiff);
}

function toJSON(arg: any) {
  return JSON.stringify(arg); // watch for circular reference things
}

function fallBackFormatter(arg: any) {
  return '' + arg;
}

export const formatters = {
  s: function (args: any) {
    return new String(args).toString();
  },
  j: toJSON,
  d: function (args: any) {
    return '' + args;
  },
  o: toJSON,
};

// first argument "spec" is a value like %u, %s, etc
export function formatToString(key: string, data: any): string {
  const formatter =
    formatters[key as keyof typeof formatters] || fallBackFormatter;
  const rc = formatter(data);
  return rc;
}

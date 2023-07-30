import { formatToString } from './formatters';

const regExp = /(?<!%)%(?<formatSpec>[A-Za-z])/g;

export default function formatter(format: string, ...args: any[]): string {
    const matches = Array.from(format.matchAll(regExp));
    // normally matches.length should be equal to args.length, but we want to be nice
    //  if a %s (example) is not matched by an argument then leave it as is
    //  if there are many more arguments then "%x" format specs then ignore those arguments
    //  NOTE: if there where no matches then still an array is returned but EMPTY
    if (matches.length === 0) {
        return format;
    }
    const nrArguments = Math.min(matches.length, args.length);
    const interpolated: string[] = [];
    let i = 0;
    do {
        const start: number = i > 0 ? (matches[i - 1]?.index || (0 as number)) + 2 : 0;
        const stop: number = matches[i]?.index as number;
        if (start !== stop) {
            interpolated.push(format.slice(start, stop));
        }
        const regExpMatch = matches[i] as RegExpExecArray;
        // formatSpec exist if you are here, force it to string type
        const formatSpec = regExpMatch?.groups?.formatSpec as string;
        interpolated.push(formatToString(formatSpec, args[i]));
        // push stringified value from args[i] according to matches[i]
        i++;
    } while (i < nrArguments);
    // is there a piece of text after the last (%.)?
    const last: number = ((matches[nrArguments - 1]?.index as number) || (0 as number)) + 2;
    if (format.length > last) {
        interpolated.push(format.slice(last, format.length));
    }
    const output = interpolated.join('');
    return output;
}

'use strict';
//from https://en.wikipedia.org/wiki/Path_(computing)
/* 
allowed chars in filepath names
https://docs.microsoft.com/en-us/windows/win32/fileio/naming-a-file?redirectedfrom=MSDN#win32-device-namespaces
The following reserved characters:

< (less than)
> (greater than)
: (colon)
" (double quote)
/ (forward slash)
\ (backslash)
| (vertical bar or pipe)
? (question mark)
* (asterisk)
Integer value zero, sometimes referred to as the ASCII NUL character.

Characters whose integer representations are in the range from 1 through 31, except for alternate data streams where these characters are allowed. For more information about file streams, see File Streams.

Any other character that the target file system does not allow.
*/

const tokens = {
    SEP: '\x01', //  '\\' or '/' token
    ROOT_POSIX: '\0x02',
    ROOT_CMD: '\0x03', //like '[driveletter]:\' or [driveletter]:/
    ROOT_SERVER: '0x04',
    // dir \\servername\volume\ 
    // dir //localhost/volume/  (note beingins with "//")
    ROOT_LONG_UNC: '\0x05', // no interpolation of "." and ".."
    // extended with server\drive
    //dir \\.\UNC\localhost\c$\bin will list the content of bin (works but should not allow it?)
    //dir \\?\UNC\localhost\c$\bin will only show the directory "bin" (not its content)
    //dir \\?\UNC\localhost\c$\bin\* will show contents of bin
    ROOT_DEVICE: '\0x06',
    // dir \\.\Volume{c7586f73-3a1f-4dd4-b069-ed096296d352}\
    // dir "//./Volume{c7586f73-3a1f-4dd4-b069-ed096296d352}/" (will work in powershell showing contents of c:\\)
    // dir "//./x:"  (works,  from cmd and powershell)
    // dir "//./x:/"
    // dir \\.\x:
    // dir \\.\PHYSICALDRIVE0
    ROOT_SHORT_UNC: '\0x07',
    // dir "\\?\Volume{c7586f73-3a1f-4dd4-b069-ed096296d352}\Program Files" just shows dir but not content
    // dir "\\?\Volume{c7586f73-3a1f-4dd4-b069-ed096296d352}\" (will not work in powershell)
    CURRENT: '\0x08', //  '.'
    PARENT: '\0x09', // '..'
    PATHPATH: '\0x0a',
};


function find(str, start, end, ...chars) {
    if (!chars.length) return undefined;
    for (let i = start; i <= end; i++) {
        if (chars.includes(str[i])) {
            return i;
        }
    }
    return undefined;
}

function lookAhead(str, fn, start, length = str.length - start) {
    let i = start;
    for (; i < str.length; i++) {
        if (i >= (start + length)) {
            break;
        }
        if (fn(str[i])) {
            continue;
        }

    }
    i--;
    // so i is at the place where conditions have failed
    return ({
        end: i,
        start,
        length: i - start + 1
    });
}

function validSep(s){
    return s === '\\' || s === '/';
}
// generator
function* UNCRootAbsorber(str, start, end) {
    let i = start;
    const { length } = lookAhead(str, validSep, start, 2, end);
    if (length < 2) {
        return; // abort
    }
    if (str[i + length] === '?' && validSep(str[i + length + 1]) ) { // found long unc 
        i = i + length + 1;
        // optionally absorb the string 'unc\\'
        //                               12345 
        if (str.slice(i + 1, i + 4).toLowerCase() === 'unc' && validSep(str[i+4])) {
            yield {
                value: '\\\\?\\UNC\\',
                token: tokens.ROOT_LONG_UNC,
                start,
                end: i + 4
            };
            return;
        }
        yield {
            value: '\\\\?\\',
            token: tokens.ROOT_LONG_UNC,
            start,
            end: i
        };
        return;
    }
    // found short unc
    yield {
        value: '\\\\',
        token: tokens.ROOT_SHORT_UNC,
        start,
        end: i
    };
    return;
}


function createTokenizer(fn) {
    return function* tokenize(str = '', start = 0, end = str.length - 1) {
        yield* fn(str, start, end);
    }
}

const uncTokenizer = createTokenizer(UNCRootAbsorber);

module.exports = {
    uncTokenizer
};
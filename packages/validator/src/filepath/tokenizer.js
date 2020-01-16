'use strict';
//from https://en.wikipedia.org/wiki/Path_(computing)
/* 
allowed chars in filepath names
https://docs.microsoft.com/en-us/windows/win32/fileio/naming-a-file?redirectedfrom=MSDN#win32-device-namespaces
The following reserved characters:

< (less than)
> (greater than)
: (colon)  (only when specifying a device in windows)
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
    LOCAL_FS_ROOT: '\0x03', //like '[driveletter]:\' or [driveletter]:/
    ROOT_SERVER: '0x04', // FIX: REMOVE THIS, IS ACTUALLY SHORT_UNC
    // is actually short_unc
    // dir \\servername\volume\ 
    // dir //localhost/volume/  (note beingins with "//")
     ROOT_LONG_UNC: '\0x05', //no interpolation of "." and ".."
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
    PATHPART: '\0x0a', // gheneral path slice, could be anything
};

function lookAhead(str, fn, start, length = str.length - start) {
    let i = start;
    for (; i < str.length; i++) {
        if (i >= (start + length)) {
            break;
        }
        if (!fn(str[i])) {
            break;
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

function validSep(s) {
    return s === '\\' || s === '/';
}
// generator
function* uncTokenizer(str = '', start = 0, end = str.length - 1) {
    let i = start;
    const { length } = lookAhead(str, validSep, start, 2, end);
    if (length < 2) {
        return; // abort
    }
    let long = false;
    let unc;
    const s0 = str[i + length];
    const sep0 = str[i + length + 1];
    const UNC = str.slice(i + length + 2, i + length + 5).toLowerCase();
    const sep1 = str[i + length + 5];
    if ((s0 === '.' || s0 === '?') && validSep(sep0)) { // the "." is an alias for "?"
        long = true;
        if (UNC === 'unc' && validSep(sep1)) {
            unc = 'UNC\\';
        }
    }
    if (long) {
        if (unc) {
            yield {
                value: '\\\\?\\UNC\\',
                token: tokens.ROOT_LONG_UNC,
                start,
                end: start + 7
            };
            return;
        }
        yield {
            value: '\\\\?\\',
            token: tokens.ROOT_LONG_UNC,
            start,
            end: start + 3
        };
        return;
    }
    yield {
        value: '\\\\',
        token: tokens.ROOT_SHORT_UNC,
        start,
        end: start + 1
    };
    return;
}

// generator
function* unxRootTokenizer(str = '', start = 0, end = str.length - 1) {
    if (str[start] === '/' && validSep(str[start + 1]) === false) {
        yield {
            value: '/',
            token: tokens.ROOT_POSIX,
            start,
            end: start
        };
        return
    };
    return
}

const dA = 'A'.charCodeAt(0);
const dZ = 'Z'.charCodeAt(0);
const da = 'a'.charCodeAt(0);
const dz = 'z'.charCodeAt(0);

function* lfsRootTokenizer(str = '', start = 0, end = str.length - 1) {
    const drive = str[start].charCodeAt(0);

    if (((drive => dA && drive <= dZ) || (drive => da && drive <= dz)) && str[start + 1] === ':' && validSep(str[start + 2])) {
        yield ({
            value: str.slice(start, start + 2),
            token: tokens.LOCAL_FS_ROOT,
            start,
            end: start + 2
        });
    }
    return;
}

function* sepSlicer(str = '', start = 0, end = str.length - 1) {
    const length = str.length;
    // clamp
    end = Math.min(str.length -1, Math.max(end,0));
    let i = start;
    for (; i <= end; i++){
        if (validSep(str[i])){
            yield {
                value: str[i],
                token: tokens.SEP,
                start :i,
                end: i
            };
        }
    }
}

/*
< (less than)
> (greater than)
: (colon)
" (double quote)
/ (forward slash)
\ (backslash)
| (vertical bar or pipe)
? (question mark)
* (asterisk)
*/

module.exports = {
    uncTokenizer,
    unxRootTokenizer,
    lfsRootTokenizer,
    sepSlicer
};
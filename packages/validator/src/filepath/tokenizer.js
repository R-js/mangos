'use strict';
//from https://en.wikipedia.org/wiki/Path_(computing)
/* allowed chars in filepath names
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

function* UNCLongShortAbsorber(prefix, str, start, end) {
    let root;
    // root long unc
    const realPrefix = prefix.replace(/\\/g, '/');
    const realPrefix2 = prefix.replace(/\//g, '\\');
    const prefixLength = realPrefix2.length;
    root = str.slice(start, start + prefixLength);
    if (!(root === realPrefix || root === realPrefix2)) {
        return undefined;
    }
    let noserver = false;
    let p1;
    if (start+prefixLength >= end){
        noserver = true;
    }
    if (!noserver){
         p1 = find(str, start + prefixLength, end, '\\', '/');
    }
    if (p1 === start+prefixLength){
        noserver = true;
    }
    p1 = p1 || end + 1;
    if (noserver) {
        yield {
            error: `missing "servername" part in "${realPrefix}/servername/mount" for unc long name`,
            start,
            end,
            token: tokens.ROOT_LONG_UNC
        };
        return;
    }
    const serverName = str.slice(start + prefixLength, p1);
    // find mount
    let nomount = false;
    if (p1 >= end) {
        nomount = true;
    }
    let p2 = find(str, p1 + 1, end, '\\', '/');
    if (p2 === p1 + 1) {
        nomount = true;
    }
    p2 = p2 || end + 1;
    if (nomount) {
        yield {
            error: `missing "drive mount" part in "${realPrefix}/servername/mount" for unc long name`,
            start,
            end,
            token: tokens.ROOT_LONG_UNC
        };
        return;
    }
    const mount = str.slice(p1 + 1, p2);
    yield {
        start: start,
        end: p2 - 1,
        value: `//?/UNC/${serverName}/${mount}`
    };
}


module.exports = {
    UNCLongShortAbsorber
};
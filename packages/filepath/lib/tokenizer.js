'use strict';
const clone = require('clone');
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

Characters whose integer representations are in the range from 1 through 31,
 except for alternate data streams where these characters are allowed. For more information about file streams,
  see File Streams.

CON,
PRN,
AUX,
NUL,
COM1,
COM2,
COM3,
COM4,
COM5,
COM6,
COM7,
COM8,
COM9,
LPT1,
LPT2,
LPT3,
LPT4,
LPT5,
LPT6,
LPT7,
LPT8,
LPT9.

Any other character that the target file system does not allow.
*/

// nomenclature
//* TDP = [T]raditional [D]os [P]ath
// examples:
//      C:\Documents\Newsletters\Summer2018.pdf             An absolute file path from the root of drive C:
//      \Program Files\Custom Utilities\StringFinder.exe    An absolute path from the root of the current drive.
//      2018\January.xlsx                       A relative path to a file in a subdirectory of the current directory.
//      ..\Publications\TravelBrochure.pdf      A relative path to file in a directory that is a peer of the current directory.
//      C:\Projects\apilibrary\apilibrary.sln  An absolute path to a file from the root of drive C:
//      C:Projects\apilibrary\apilibrary.sln   A relative path from the current directory of the C: drive.
// UNC  Universal naming convention (UNC) paths,
// examples:
//      \\system07\C$\    servername: system07 (of fully qualified netbios,  IP/FQDN address ipv4/ipv6
//                        c$: shared name
//      \\Server2\Share\Test\Foo.txt
//                        servername: Server2
//                        shared name: Share
// DDP [D]os [D]evice [P]ath:
//  DOS device paths are fully qualified by definition. Relative directory segments (. and ..) are not allowed. 
// examples:
//      \.\C:\Test\Foo.txt
//      \\?\C:\Test\Foo.txt
//      \\.\Volume{b75e2c83-0000-0000-0000-602f00000000}\Test\Foo.txt 
//      \\?\Volume{b75e2c83-0000-0000-0000-602f00000000}\Test\Foo.txt
//      \\.\BootPartition\
//      \\.\UNC\Server\Share\Test\Foo.txt   // UNC is a "device" designation (network card?)  )))  Server\Share is the "volume"
//      \\?\UNC\Server\Share\Test\Foo.txt
//      \\?\server1\e:\utilities\\filecomparer\   \server1\utilities\ is the server\share

//  Path normalization

/*
Almost all paths passed to Windows APIs are normalized. During normalization, Windows performs the following steps:
Identifies the path.

- Applies the current directory to partially qualified (relative) paths.
- Canonicalizes component and directory separators.
- Evaluates relative directory components (. for the current directory and .. for the parent directory).
- Trims certain characters.

Continue tomorrow here: https://docs.microsoft.com/en-us/dotnet/standard/io/file-path-formats#identifying-the-path

*/
const tokens = {
    SEP: '\x01', // done
    POSIX_ROOT: '\0x02', // done
    TDP_ROOT: '\0x03', // traditional dos path
    UNC_ROOT: '\0x04', // unc root
    DDP_ROOT: '\0x05', // dos device path root
    PATHELT: '\0x06',
    PARENT: '\0x07',
    CURRENT: '\0x08'
};

const rootTokens = {
    POSIX_ROOT: '\0x02', // done
    TDP_ROOT: '\0x03', // traditional dos path
    UNC_ROOT: '\0x04', // unc root
    DDP_ROOT: '\0x05' // dos device path root
};

const regexpLD = /(CON|PRN|AUX|NUL|COM[\\d]|LPT[\\d]|PRN)/i;

function hasLegacyDeviceName(str = '', start = 0, end = str.length - 1) {
    const checkFrom = str.slice(start, end + 1);
    const match = checkFrom.match(regexpLD);
    if (Array.isArray(match)) {
        return match[0];
    }
}

const forbiddenRegExp = new RegExp(`[<>:"/\\|?*<\u0000}]`);

function isInValidMSDirecotryName(str = '', start = 0, end = str.length - 1) {
    return forbiddenRegExp.test(str.slice(start, end + 1));
}

function lookSuccessive(str, fn, start, end = str.length - 1) {
    let i = start;
    let len = 0;
    for (; i <= end; i++) {
        if (fn(str[i])) {
            len++;
            continue;
        }
        break;
    }
    if (len === 0) {
        return;
    }
    // return range
    return ({
        end: i - 1,
        start,
    });
}

function validSep(s) {
    return s === '\\' || s === '/';
}



// hard to infer , '\\' tokens are actually legal in linux xfs, etx4, etc
function* posixAbsorber(str = '', start = 0, end = str.length - 1) {

    const selectorPosix = [{
            fn: (str, start, end) => lookSuccessive(str, s => s !== '/', start, end),
            t: tokens.PATHELT
        },
        {
            fn: (str, start, end) => lookSuccessive(str, s => s === '/', start, end),
            t: tokens.SEP
        }
    ];

    // "/" start with "/" or '\' tokens should be converted to "/"
    let i = start;
    const root = lookSuccessive(str, s => s === '/', start, end);
    if (root) {
        yield {
            token: rootTokens.POSIX_ROOT,
            start: start,
            end: root.end,
            value: str.slice(start, root.end + 1)
        }
        i = root.end + 1;
    }
    let toggle = 0;
    while (i <= end) {
        // find pathpart
        let token;
        const result = selectorPosix[toggle].fn(str, i, end);
        if (result) {
            const value = str.slice(i, result.end + 1);
            token = selectorPosix[toggle].t;
            if (value === '..') {
                token = tokens.PARENT;
            }
            if (value === '.') {
                token = tokens.CURRENT;
            }
            yield {
                token,
                start: result.start,
                end: result.end,
                value
            }
            i = result.end + 1;

        }
        toggle = (++toggle % 2);
    }
}

function* tdpAbsorber(str = '', start = 0, end = str.length - 1) {

    const selectorTDP = [{
            fn: (str, start, end) => lookSuccessive(str, s => !validSep(s), start, end),
            t: tokens.PATHELT
        },
        {
            fn: (str, start, end) => lookSuccessive(str, s => validSep(s), start, end),
            t: tokens.SEP
        }
    ];


    let i = start;
    let drive = str.slice(i, i + 2).toLowerCase();
    if (drive[0] >= 'a' && drive[0] <= 'z' && drive[i + 1] === ':') {
        yield {
            token: rootTokens.TDP_ROOT,
            value: `${drive}`,
            start: i,
            end: i + 1
        };
        i = start + 2;
    }
    let toggle = 0;
    while (i <= end) {
        let token;
        const result = selectorTDP[toggle].fn(str, i, end);
        if (result) {
            const value = str.slice(i, result.end + 1);
            token = selectorTDP[toggle].t;
            if (value === '..') {
                token = tokens.PARENT;
            }
            if (value === '.') {
                token = tokens.CURRENT;
            }
            const rc = {
                token,
                start: result.start,
                end: result.end,
                value
            }
            if (toggle === 0) {
                const ldn = hasLegacyDeviceName(value);
                const errors = [];
                if (ldn) {
                    errors.push(`contains forbidden DOS legacy device name: ${ldn}`);
                }
                if (isInValidMSDirecotryName(value)) {
                    errors.push(`name "${value}" contains invalid characters`);
                }
                if (errors.length) {
                    rc.error = errors.join('|');
                }
            }
            yield rc;
            i = result.end + 1;

        }
        toggle = (++toggle % 2);
    }

}

function* uncAbsorber(str = '', start = 0, end = str.length - 1) {
    // \\system07\C$\    servername: system07 (of fully qualified netbios,  IP/FQDN address ipv4/ipv6
    //                   c$: shared name
    // \\Server2\Share\Test\Foo.txt
    //                        servername: Server2
    //                        shared name: Share

    /* 2 "//" or 2 "\\"" are also ok in MS Windows */
    // regexp this
    const regexp = /^(\/\/|\\\\)([^\\\/]+)(\/|\\)([^\\\/]+)(\/|\\)/;

    const match = str.match(regexp);
    if (match === null) {
        return; // nothing to do here
    }

    const server = match[2];
    const share = match[4];
    const sep2 = '\\\\';
    const sep = '\\';
    const endUnc = match[0].length - 1;

    yield {
        token: rootTokens.UNC_ROOT,
        value: `\\\\${server}\\${share}${sep}`, // delimter at the end makes my IDE (vscode) do weird stuff
        start,
        end: endUnc
    };
    // at this point is should be just a normal dos parsing
    yield* tdpAbsorber(str, endUnc + 1, end);
}

const regExpOrderedMap = [
    //  \\?\UNC\Server\Share\
    //  \\.\UNC\Server\Share\
    ['ddpwithUNC', /^(\/\/|\\\\)(.|\\?)(\/|\\)(unc)(\/|\\)([^\/\\]+)(\/|\\)([^\/\\]+)(\/|\\)/i],

    // example  \\.\Volume{b75e2c83-0000-0000-0000-602f00000000}\ 
    // example  \\?\Volume{b75e2c83-0000-0000-0000-602f00000000}\
    ['ddpwithVolumeUUID', /^(\/\/|\\\\)(.|\\?)(\/|\\)(Volume{[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}})(\\|\/)/i],

    // example  \\?\C:\
    // example  \\.\C:\
    ['ddpwithTDP', /^(\/\/|\\\\)(.|\\?)(\/|\\)([a-z]:)(\/|\\)/i]
];

const mathMapFns = {
    ddpwithVolumeUUID(match){
        return {
            token: rootTokens.DDP_ROOT,
            value: '\\\\?\\'+match[4]+'\\',
            start: 0,
            end: match[0].length-1
        };
    },
    ddpwithUNC(match){
        return {
            token: rootTokens.DDP_ROOT,
            value: '\\\\?\\UNC\\'+match[6]+'\\'+match[8]+'\\',
            start: 0,
            end: match[0].length-1
        };
    },
    ddpwithTDP(match){
        return {
            token: rootTokens.DDP_ROOT,
            value: '\\\\?\\'+match[6]+'\\'+match[8]+'\\',
            start: 0,
            end: match[0].length-1
        }
    }
};

function* ddpAbsorber(str = '', start = 0, end = str.length - 1) {
    for (const [pk, regexp] of regExpOrderedMap) {
        const match = str.match(regexp);
        if (match === null) {
            continue; 
        }
        const record = mathMapFns[pk] && mathMapFns[pk](match);
        if (!record){
            continue;
        }
        record.start += start;
        record.end += start;
        yield record;
        yield* tdpAbsorber(str, record.end + 1, end);
        break;
    }
}


module.exports = {
    posixAbsorber,
    tdpAbsorber,
    uncAbsorber,
    ddpAbsorber,
    tokens,
    rootTokens
};
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
    PATHELT: '\x06',
    PARENT: '\x07',
    CURRENT: '\x08'
};

const rootTokens = {
    POSIX_ROOT: '\x02', // done
    TDP_ROOT: '\x03', // traditional dos path
    UNC_ROOT: '\x04', // unc root
    DDP_ROOT: '\x05' // dos device path root
};

function invertKeyValues(obj) {
    return Object.entries(obj).reduce((o, v) => {
        o[v[1]] = v[0];
        return o;
    }, {});
}
const rootTokenValues = invertKeyValues(rootTokens);

const regexpLD = /(CON|PRN|AUX|NUL|COM[\\d]|LPT[\\d]|PRN)/i;

const uncRegExp = /^(\/\/|\\\\)([^\\\/\\?\\.]+)(\/|\\)([^\\\/]+)(\/|\\)?/;

function hasLegacyDeviceName(str = '', start = 0, end = str.length - 1) {
    const checkFrom = str.slice(start, end + 1);
    const match = checkFrom.match(regexpLD);
    if (Array.isArray(match)) {
        return match[0];
    }
}

function inferPlatform() {
    if (typeof global !== undefined && global.process && global.process.platform && typeof global.process.platform === 'string') {
        return global.process.platform === 'win32' ? 'win32' : 'posix';
    }
    return 'browser';
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

function getCWDDOSRoot() {
    /*
                  cwd can be anything "tdp", "unc", and "ddp"

                   PROOF:
                   > process.chdir('//./unc/pc123/c')  // use a valid host and share on your machine
                   > process.cwd()
                       '\\\\.\\unc\\pc123\\c'

                   PROOF:
                   > process.chdir('//pC123/c')
                   > process.cwd()
                       '\\\\pc123\\c'
               */
    const cwdPath = getCWD(); // cwd can be anything, even unc //server/share , but not //./unc/ or any other
    const ddpTokens = Array.from(ddpAbsorber(cwdPath));
    if (ddpTokens.length) {
        return scantoken[0]; // emit the root
    }
    const uncTokens = Array.from(uncAbsorber(cwdPath));
    if (uncTokens.length) {
        return uncTokens[0];
    }
    // guess its normal tdp
    let drive = cwdPath.slice(0, 2).toLowerCase();
    if (drive[0] >= 'a' && drive[0] <= 'z' && drive[1] === ':') {
        return {
            token: rootTokens.TDP_ROOT,
            value: `${drive}`,
            start: 0,
            end: 1
        };

    }
    return undefined;
}

function tdpRootNeedsCorrection(str) {
    const match = str.match(/^[\/\\]+/);
    if (match) {
        const exclusions = regExpOrderedMapDDP.slice();
        exclusions.push(['unc', uncRegExp]);
        const shouldNotFind = exclusions.find(([ns, regexp]) => str.match(regexp));
        if (shouldNotFind) {
            return undefined;
        }
        return { start: 0, end: match[0].length - 1 };
    }
    return undefined;
}

function* tdpBodyAbsorber(str = '', start = 0, end = str.length - 1) {
    const selectorTDP = [{
        fn: (str, start, end) => lookSuccessive(str, s => !validSep(s), start, end),
        t: tokens.PATHELT
    },
    {
        fn: (str, start, end) => lookSuccessive(str, s => validSep(s), start, end),
        t: tokens.SEP
    }
    ];

    // also a unix path would work if it is winsos system
    let toggle = 0;
    let i = start;
    while (i <= end) {
        let token;
        const result = selectorTDP[toggle].fn(str, i, end);
        if (result) {
            const value = toggle === 0 ? str.slice(i, result.end + 1) : '\\';
            token = selectorTDP[toggle].t;

            const errors = [];
            if (toggle === 0) {
                switch(value){
                case '..': 
                    token = tokens.PARENT;
                    break;
                case '.':
                    token = tokens.CURRENT;
                    break;
                default:   
                    const ldn = hasLegacyDeviceName(value);
                   
                    if (ldn) {
                        errors.push(`contains forbidden DOS legacy device name: ${ldn}`);
                    }
                    if (isInValidMSDirecotryName(value)) {
                        errors.push(`name "${value}" contains invalid characters`);
                    }
                   
                }   
            }
            const rc = {
                token,
                start: result.start,
                end: result.end,
                value
            }
            if (errors.length) {
                rc.error = errors.join('|');
            }
            yield rc;
            i = result.end + 1;
        }
        toggle = (++toggle % 2);
    }
}

function* tdpAbsorber(str = '', start = 0, end = str.length - 1) {

    let i = start;
    // needs correction ?
    const result = tdpRootNeedsCorrection(str.slice(i, end + 1));
    if (result) {
        // it should not match
        const os = inferPlatform();
        if (os === 'win32') { // in this case we need to have to current drive
            /*
               cwd can be anything "tdp", "unc", and "ddp"
                PROOF:

                > process.chdir('//./unc/pc123/c')  // use a valid host and share on your machine
                > process.cwd()
                    '\\\\.\\unc\\pc123\\c'
            */
            const winRoot = getCWDDOSRoot();
            if (winRoot) {
                winRoot.end += start;
                winRoot.start += start;
                yield winRoot; // all roots DONT have '/' token
                if (result.end >= end) { // we dont have rest-data
                    return;
                }
                // adjust
                str = str.slice(0, start) + winRoot.value + '\\' + str.slice(start + result.end + 1);
                end = end + (winRoot.value.length) - (result.end + 1) + 1; // 
                i = start + winRoot.value.length;
                yield* tdpBodyAbsorber(str, i, end);
                return;
            }
        }
        // illegal char!! as a dos directory name, not good at all
        const value = str.slice(result.start, result.end + 1);
        yield {
            value,
            token: tokens.PATHELT,
            start,
            end: result.end,
            error: `path ${str} contains invalid ${value} as path element`
        };
        i = result.end + 1;
    }

    if (str.slice(i, end).match(uncRegExp)) {
        return;
    }

    let drive = str.slice(i, i + 2).toLowerCase();
    if (drive[0] >= 'a' && drive[0] <= 'z' && drive[1] === ':') {
        yield {
            token: rootTokens.TDP_ROOT,
            value: `${drive}`,
            start: i,
            end: i + 1
        };
        i = start + 2;
    }
    // also a unix path would work if it is winsos system
    yield* tdpBodyAbsorber(str, i, end);
}

function* uncAbsorber(str = '', start = 0, end = str.length - 1) {
    // \\system07\C$\    servername: system07 (of fully qualified netbios,  IP/FQDN address ipv4/ipv6
    //                   c$: shared name
    // \\Server2\Share\Test\Foo.txt
    //                        servername: Server2
    //                        shared name: Share

    /* 2 "//" or 2 "\\"" are also ok in MS Windows */
    // regexp this

    const match = str.match(uncRegExp);
    if (match === null) {
        return; // nothing to do here
    }

    const server = match[2];
    const share = match[4];
    const sep2 = '\\\\';
    const sep = '\\';
    const value = `\\\\${server}\\${share}`;
    const endUnc = value.length - 1;

    yield {
        token: rootTokens.UNC_ROOT,
        value, // delimter at the end makes my IDE (vscode) do weird stuff
        start,
        end: endUnc
    };
    // at this point is should be just a normal dos parsing
    yield* tdpBodyAbsorber(str, endUnc + 1, end);
}

const regExpOrderedMapDDP = [
    //  \\?\UNC\Server\Share\
    //  \\.\UNC\Server\Share\
    ['ddpwithUNC', /^(\/\/|\\\\)(.|\\?)(\/|\\)(unc)(\/|\\)([^\/\\]+)(\/|\\)([^\/\\]+)(\/|\\)?/i],

    // example  \\.\Volume{b75e2c83-0000-0000-0000-602f00000000}\ 
    // example  \\?\Volume{b75e2c83-0000-0000-0000-602f00000000}\
    ['ddpwithVolumeUUID', /^(\/\/|\\\\)(.|\\?)(\/|\\)(Volume{[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}})(\\|\/)?/i],

    // example  \\?\C:\
    // example  \\.\C:\
    ['ddpwithTDP', /^(\/\/|\\\\)(.|\\?)(\/|\\)([a-z]:)(\/|\\)?/i]
];

const mathMapFns = {
    ddpwithVolumeUUID(match) {
        const value = '\\\\?\\' + match[4];
        return {
            token: rootTokens.DDP_ROOT,
            value,
            start: 0,
            end: value.length - 1
        };
    },
    ddpwithUNC(match) {
        const value = '\\\\?\\UNC\\' + match[6] + '\\' + match[8];
        return {
            token: rootTokens.DDP_ROOT,
            value,
            start: 0,
            end: value.length - 1
        };
    },
    ddpwithTDP(match) {
        const value = '\\\\?\\' + match[4];
        return {
            token: rootTokens.DDP_ROOT,
            value,
            start: 0,
            end: value.length - 1
        }
    }
};

function* ddpAbsorber(str = '', start = 0, end = str.length - 1) {
    for (const [pk, regexp] of regExpOrderedMapDDP) {
        const match = str.match(regexp);
        if (match === null) {
            continue;
        }
        const record = mathMapFns[pk] && mathMapFns[pk](match);
        if (!record) {
            continue;
        }
        record.start += start;
        record.end += start;
        yield record;
        yield* tdpBodyAbsorber(str, record.end + 1, end);
        break;
    }
}

function getCWD() {
    if (typeof global !== 'undefined' && global.process && global.process.cwd && typeof global.process.cwd === 'function') {
        return global.process.cwd();
    }
    if (typeof window !== 'undefined' && window.location && window.location.pathname) {
        return window.location.pathname;
    }
    return '/'
}

module.exports = {
    posixAbsorber,
    tdpAbsorber,
    uncAbsorber,
    ddpAbsorber,
    tokens,
    rootTokens,
    rootTokenValues,
    getCWD
};
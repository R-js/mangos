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

uncTokenizer,
unxRootTokenizer,
lfsRootTokenizer,
sepSlicer

// nomenclature
// TDP = [T]raditional [D]os [P]ath
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
    TDP_ROOT: '\0x03',
    UNC_ROOT: '\0x04',
    DDP_ROOT: '\0x05',
    
};

DOS device paths


function lookAheadUntill(str, fn, start, length = str.length - start) {
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
// generator, unc
function* uncRootAbsorber(str = '', start = 0, end = str.length - 1) {
    let i = start;
    const { length } = lookAheadUntill(str, validSep, start, 2, end);
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
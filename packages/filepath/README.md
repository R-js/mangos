
# filepath

_Part of the monorepo [mangos][mangos-mono-repo]_

LL(1) parser utility to tokenizer microsoft modern/legacy and linux paths _unc_, _dos_, _devicePath_ and _posix_ file paths.

Works in browser and in node/bun

## features

- infer the OS file sdystem types based on string value only (ranked in order of most likely)
- validates path strings, (checks for forbidden characters.. etc)for the various os filetypes
- robust error reporting if the match partially failed, or use of invalid path names characters

_Note: in browser mode current working directory is `/`_

_Support the work by starring this [repo](https://github.com/R-js/mangos) on github._

It handles the following paths types:

| path type    | description                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------- |
| `unc`        | microsoft unc filepath                                                                       |
| `dos`        | traditional dos path (tdp) path                                                              |
| `devicePath` | dos device path (ddp), alos allowing for dos devicepath descibing UNC `//./UNC/Server/Share` |
| `posix`      | posix path                                                                                   |

## Installation

```bash
npm install @mangos/filepath
```

## Overview

`@mangos/filepath` exports 2 functions.

```typescript
import {  inferPathType, resolve } from '@mangos/filepath';
```

| function        | description                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| `inferPathType` | try to tokenize a path by inferring from the string argument (or manually setting) using _path types_ formats |
| `resolve`       | akin to nodejs `path.resolve`, but respecting `unc` , `unc_long` and `device path` roots                      |


## `inferPathType(src: string, options: )`

- `path` [string][string] File path
- `options` [Object][object]
    - **unc**: [boolean][boolean] default will be set the the value of `platform === 'win32'`. If true, interperet the path as a unc pathname, if this is not possibe, `lexPath` returns undefined.
    - **dos**: [boolean][boolean] default will be set to the value of  `platform === 'win32'`. If true,interperet as a TDP (Traditional Dos Path), if not possible, `lexPath` returns undefined.
    - **devicePath**: [boolean][boolean] default will be set to value of `platform === 'win32'`. If true, interperet as DDP (Dos Device Path).
    - **posix**: [boolean][boolean] default will be set to value of `platform !== 'win32'`. If true,interpret a UNIX devivce path.
- Returns: [iterator < PathObject >](#pathobject) an Iterator returning valid interpretations (plural) of the `path` the most likely file types first.

### Example:

```javascript
import { inferPathType } from '@mangos/filepath';

//  need to escape \ with \\
const iterator = inferPathType('\\\\?\\unc\\c:/Users'); // escape backslashes \\
const result = Array.from(iterator); // give all possible filesystem matches
```

### Result
```json
[
    // successfully match string against "dos device path" format
    {
        "type": "devicePath",
        "path": [
            {
                "token": "\u0005",
                "value": "\\\\?\\UNC\\c:\\Users",
                "start": 0,
                "end": 15
            }
        ]
    },
    // same string, matched against "traditional dos path", but produced some errors
    {
        "type": "dos",
        "path": [
            {
                "token": "\u0001",  // type value: "path seperator"
                "start": 0,
                "end": 1,
                "value": "\\"
            },
            {
                "token": "\u0006",  // type value: "path fragment" (between seperators)
                "start": 2,
                "end": 2,
                "value": "?",
                // "?": is not a valid char in dos pathnames
                "error": "name \"?\" contains invalid characters"
            },
            {
                "token": "\u0001",
                "start": 3,
                "end": 3,
                "value": "\\"
            },
            {
                "token": "\u0006",
                "start": 4,
                "end": 6,
                "value": "unc"
            },
            {
                "token": "\u0001",
                "start": 7,
                "end": 7,
                "value": "\\"
            },
            {
                "token": "\u0006",
                "start": 8,
                "end": 9,
                "value": "c:",
                // ":" is not a valid char in dos pathnames
                "error": "name \"c:\" contains invalid characters" 
            },
            {
                "token": "\u0001",
                "start": 10,
                "end": 10,
                "value": "\\"
            },
            {
                "token": "\u0006",
                "start": 11,
                "end": 15,
                "value": "Users"
            }
        ],
        "firstError": {
            "token": "\u0006",
            "start": 2,
            "end": 2,
            "value": "?",
            // "?" is not a valid char in dos pathnames
            "error": "name \"?\" contains invalid characters"
        }
    }
]
``` 

## `resolve(src?: string, ...paths: string[])`

 
Resolve will work exactly like `path.resolve` but with these difference: It will respect the `devicePath` roots including the `Server` and `share` parts aswell. aka `//./unc/server/share` will seen as a root in totality.

- `...paths: string[]` A sequence of file path or paths segments, the sequence can be empty (returns current working directory)
- Returns: Object of [PathObject](#pathobject). 

### example 1:

```javascript
import { resolve } from '@mangos/filepath';
const result = resolve('//./unc/Server1/share1/dir1/file.txt','../../../../hello/world');
//->
/*
{ path:
   [ { token: '\u0005',
       value: '\\\\?\\UNC\\Server1\\share1',
       start: 0,
       end: 21 },
     { token: '\u0001', start: 22, end: 22, value: '\\' },
     { token: '\u0006', start: 23, end: 39, value: 'hello' },
     { token: '\u0001', start: 40, end: 40, value: '\\' },
     { token: '\u0006', start: 41, end: 63, value: 'world' } ],
  type: 'devicePath' }
*/
```

### example 2:

```javascript
import { resolve } from '@mangos/filepath';

// suppose current working directory is "/home/user1" (on a posix filesystem)
const result = resolve('h1','h2');
//->
/*
{ path:
   [
    // working dir prefix is alos tokenized
    { token: '\u0002', start: 0, end: 0, value: '/' },
    { token: '\u0006', start: 1, end: 4, value: 'home' },
    { token: '\u0001', start: 5, end: 5, value: '/' },
    { token: '\u0006', start: 6, end: 10, value: 'user1' },

    
    { token: '\u0001', start: 11, end: 11, value: '/' },
    { token: '\u0006', start: 12, end: 13, value: 'h1' },
    { token: '\u0001', start: 14, end: 14, value: '/' },
    { token: '\u0006', start: 15, end: 16, value: 'h2' }
],
 type: 'posix' }
*/
```

## Types

### `Token-ID`

The path lexer produces pieces of the string filepath as tokens, this is a list of all the lexer tokens

| token      | value (token id) | descriptions                                  | example                                            |
| ---------- | ---------------- | --------------------------------------------- | -------------------------------------------------- |
| SEP        | `\u0001`         | filepath seperator                            | `/` or `\`                                         |
| POSIX_ROOT | `\u0002`         | a posix root `/` at the beginning of a path   |                                                    |
| TDP_ROOT   | `\u0003`         | root of a traditional dos path                | `c:`                                               |
| UNC_ROOT   | `\u0004`         | root token for a UNC root                     | `//server1/share1` or `\\server|\share1`           |
| DDP_ROOT   | `\u0005`         | dos device root                               | `\\?\unc\server1\share1` or `\\.\\c:` or `\\.\COM` |
| PATHELT    | `\u0006`         | directory/file name between to `SEP`          |                                                    |
| PARENT     | `\u0007`         | a PATHELT representing a PARENT directory     | `..`                                               |
| CURRENT    | `\u0008`         | a PATHELT representing the current director i | `.`                                                |


### `Token`

This Token is the result of a lexer slicing and dicing a the a string representing a path

```typescript
interface Token {
    value: string; // a sanatized value of this token
    start: number; // the index of original string, indicating the start of the token
    end: number; //  the index of original string, indicating the end (inclusive) of the token
    error?: string; // it this token contains errors (like forbidden charactes in dos paths)
    token: string; // indicates what kind of token, values are between `\u0001` and `\u0008`
}
```

For the `token` values, see this [list](#token-id)

### `PathObject`

- The function [inferPathType](#inferpathtypepath-options) returns an iterator of PathObject
- The function [lexPath](#lexpathpathoptions) returns a single instance of `PathObject`

```typescript
interface PathObject {
    type: 'posix'|'unc'|'dos'|'devicePath',
    path: Token[];
    firstError?: string; //-> first error encounterd in the token array (from left to right)
}
```

## Feedback

We appreceate any feedback, with new ideas, to enhance this tool suite. File an issue [here](https://github.com/R-js/mangos/issues)

Before contributing, please read our contributing [guidelines](CODE_OF_CONDUCT.md) and [code of conduct](CONTRIBUTING_GUIDELINES.md).

## [License](LICENSE)

Copyright (c) 2019-2020 Jacob Bogers `info@mail.jacob-bogers.com`.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.


[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type
[ddp]: https://docs.microsoft.com/en-us/dotnet/standard/io/file-path-formats#dos-device-paths
[tdp]: https://docs.microsoft.com/en-us/dotnet/standard/io/file-path-formats#traditional-dos-paths
[posix]: https://pubs.opengroup.org/onlinepubs/009695399/basedefs/xbd_chap03.html#tag_03_266
[mangos-mono-repo]: https://github.com/R-js/mangos



# filepath tokenizer

Why?
- Easy and consistent way to work with different filesystems irrespective of the OS the process using this library is running on.
- <a id="failure-modes"></a> Node `resolve` has failure modes, it will consume the root element of a path if you insert enough `..` parent operators.

Node <code>resolve</code> has failure modes, they are discussed below for the several file systems</h2>

## Synopsis

_Part of the monorepo [mangos][mangos-mono-repo]_

- Tokenizes filepath string into its consituants;
- Preserves correctly (node `resolve` does not) the root of _dos device path_ and _unc path_.
- Provides utilities to work with different path types irrespective of OS used.

## Supported Paths

- [Microsoft dos device path][ddp]
- [UNC path][unc]
- [Traditional DOS path][tdp]
- [Unix path][posix]

## Node [`resolve`][node-resolve] has <a href="#failure-modes">failure modes</a>, they are discussed below for the several file systems.

### dos device path (ddp) failure

[`resolve`][node-resolve] below snippet will mangle the `'//?/C:/repos'`

```javascript
import { resolve } from 'node:path';
// note \ needs to be escaped to \\ so we use / instead

resolve('//?/C:/repos','../../../text.txt');
// ->  //?/text.txt  
// -> "//?/C": is lost
```

```javascript
import { resolve } from 'filepath';
resolve('//?/C:/repos','../../../text.txt');
// -> '//?/C:/repos\text.txt'
// -> correctly preserves "//?/C:/repos"
```

### unc path failure

[`resolve`][node-resolve] below snippet will mangle the `//?/UNC/Server/share`

```javascript
// node resolve
import { resolve } from 'node:path';
resolve('//?/UNC/Server/share', '../../../txt');
// -> '//?/txt'  //?//UNC/Server/share is destroyed by node resolve
```

resolve from filepath preserves root

```javascript
import { resolve } from '@mangos/filepath';

resolve('//?/UNC/Server/share', '../../../txt');
// -> '//?/UNC/Server//share//txt'   
//
// root is preserved (//?/UNC/Server//share)

// another example
resolve('//system07/c$/x/y', '../../../../../txt');
// -> '\\\\system07\\c$\\txt' unc root preserved 
```

### windows device path preservation


```javascript
import { resolve } from '@mangos/filepath';

resolve('//./Volume{b75e2c83-0000-0000-0000-602f00000000}/Test/Foo.txt', '../../../../../hello/world');
//
// ->  //?/Volume{b75e2c83-0000-0000-0000-602f00000000}/hello/world
//
// despite the ../../ etc sequence of the second argument the root is preserved
// also the "//./" is replaced by modern //?/ to prevent legacy file handling in windows

```

## Api

### Overview

#### Functions

There are 4 exported functions:

```typescript
import { allPlatforms, parse, resolve, resolvePathObject } from '@mangos/filepath';
```

- `allPlatforms`: infer filesystem from the path string, optionally using options.
- `parse`: infer the most likely filesystem from path string, optionally using options.
- `resolve`: like `node:path` counterpart but preserve root elements in the path
- `resolveObject`: same as `resolve` but uses a js class instance of type `ParsedPath` as the first argument, the second argument is the usual string for `resolve`

#### Classes

There is only one class wich is the implementation of interface `ParsedPath`
You will never create a ParsedPath directly it is created for you either by `allPath` or `firstPath`

```typescript
import { type ParsedPath, parse } from '@mangos/filepath';

const pp: ParsedPath = firstPath('//./Volume{b75e2c83-0000-0000-0000-602f00000000}/Test/Foo.txt');
```

```typescript 
export interface ParsedPath {
    get path(): PathToken[];                        // path-string is parsed to an array of PathToken
    get type(): FileSystem;                         // filesystem type
    clone(path: PathToken[]): ParsedPath;           // clone this result
    toString(): string;                             // generate the path string from tokens
    isRelative(): boolean;                          // was the path relative
    toDto(): ParsedPathDto;                         // export this parsed object as a dto 
    get firstError(): PathToken | undefined;        // reference to the first token that is in error
    get allErrors(): TokenDto[];                    // get all errors as a dto
    iterator(): Generator<PathToken, void, void>;   // loop over all tokens beginning at the root of the path
}


export interface PathToken {
    isRoot(): boolean;                 // is this a root of the path (relative paths dont have a root)
    isSeparator(): boolean;            // is this a "/" (linux) "\" (windows)
    isPathElement(): boolean;          // is this a normal path element
    isCurrent(): boolean;              // is this a "." current dir element     
    isParent(): boolean;               // is this a parent ".." element
    equals(ot: PathToken): boolean;    // are 2 pathtokens the same
    hasError(): boolean;               // was there a parsing error? (illigal path character for example)
    get error(): undefined | string;   // get the error 
    get type(): PathTokenEnumKeys;     // Union type "sep" | "root" | "pathElt" | "parent" | "current"
    get value(): string;               // the original value that this token wraps
    get start(): number;               // the start postion (zero based offset) in the path string slice of this path element
    get end(): number;                 // the end position (inclusive) of the path string slice of this path element
    clone(): PathToken;                // clone this path element
    toDto(): TokenDto;                 // create a plain dto of the token
}
```

#### Dto Types

```typescript
export type ParsedPathDto = {
    type: FileSystem;                  // type of file sysem  "unc" | "dos" | "devicePath" | "posix"
    path: TokenDto[];                  // array of tokens generated by parsing
};

export type TokenDto = {
    type: PathTokenEnumKeys;           // type of token "sep" | "root" | "pathElt" | "parent" | "current"
    error?: undefined | string;        // this token has an error
    value: string;                     // string value of the token
    start: number;                     // start position (zero index) of this token value in the raw string
    end: number;                       // end poistion (inclusive) of this token value in the raw string
};
```

#### Identity Types

- `PathTokenEnumKeys`: used to as a discriminating literal type for the different kind of tokens `"sep" | "root" | "pathElt" | "parent" | "current"`.
- `FileSystem`: Union type of supported paths: `type FileSystem: "unc" | "dos" | "devicePath" | "posix";`


###  Typical Usage

#### `parse`

```typescript

import { parse } from '@mangos/filepath';

// parse path (inferred as a "dos" path)
const parsed0 = parse('c:/repos/myproject');

const parsed1 = parse('c:/repos/myproject');
// try to parse it as a dos path

const parsed2 = parse('/repos/myproject');
// on windows platform, it will prefix with "c:" root
// on linux/posix platform it make the first "/" a root token 
```

#### `allPlatforms`

Returns an array of parsed objects representing different file systems that are possible with given path string value.

```typescript
import { allPlatforms } from '@mangos/filepath';
const parsed = allPlatforms('//./UNC/Server/share');
// parsed will be an array of 2 ParseObjects, one of type "unc" and one of type "dos"

// the dos type needs clarification, in theory you could have directory names "UNC" with subdirectory "Server"
```
## License

Copyright (c) 2019-2025 Jacob Bogers `jkfbogers@gmail.com`.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

[unc]: https://learn.microsoft.com/en-us/dotnet/standard/io/file-path-formats#unc-paths
[ddp]: https://docs.microsoft.com/en-us/dotnet/standard/io/file-path-formats#dos-device-paths
[tdp]: https://docs.microsoft.com/en-us/dotnet/standard/io/file-path-formats#traditional-dos-paths
[posix]: https://pubs.opengroup.org/onlinepubs/009695399/basedefs/xbd_chap03.html#tag_03_266
[mangos-mono-repo]: https://github.com/R-js/mangos
[node-resolve]: https://nodejs.org/api/path.html#pathresolvepaths

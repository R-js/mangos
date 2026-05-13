
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

#### There are 4 exported functions:

```typescript
import { allPath, firstPath, resolve, resolvePathObject } from '@mangos/filepath';
```

- `allPath`: infer filesystem from the path string, optionally using options.
- `firstPath`: infer the most likely filesystem from path string, optionally using options.
- `resolve`: like `node:path` counterpart but preserve root elements in the path
- `resolveObject`: same as `resolve` but uses a js object instead of path string

#### Classes

```typescript
import { type ParsedPath, firstPath } from '@mangos/filepath';

const pp: ParsedPath = firstPath('//./Volume{b75e2c83-0000-0000-0000-602f00000000}/Test/Foo.txt');
```

You will never create a ParsedPath directly it is created for you either by `allPath` or `firstPath`

```typescript 
export interface ParsedPath {
    get path(): PathToken[];                        // path string is parsed in an array of PathToken
    get type(): FileSystem;                         // filesystem type
    clone(path: PathToken[]): ParsedPath;           // clone this result
    toString(): string;                             // generate the path string from tokens
    isRelative(): boolean;                          // was the path relative
    toDto(): ParsedPathDto;
    get firstError(): PathToken | undefined;
    get allErrors(): TokenDto[];
    iterator(): Generator<PathToken, void, void>;
}


- `ParsedPath`: the result of parsing operation `allPath`, `firstPath`. it is an implementation of the `PathToken` interface

#### Types

There are 3 types

```typescript
import type { FileSystem, PathToken, PathTokenEnumKeys } from '@mangos/filepath'
```

- `FileSystem`: Union type of supported paths: `type FileSystem: "unc" | "dos" | "devicePath" | "posix";`
- `Pathtoken`: A Tokenized Path Element. A path like `/hello/world.txt` will be tokenized into 4 Path tokens  `/`, `hello`, `/`, `world.txt`

```typescript
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

- `PathTokenEnumKeys`: used to as a discriminating literal type for the different kind of tokens `"sep" | "root" | "pathElt" | "parent" | "current"`.




<h3 id="fn-all-"></h3>

<h3 id="infer-path-options">Type <code>InferPathOptions</code></h3>

The functions <a href="#fn-all-path"><code>allPath</code></a> and <a href="#fn-first-path"><code>firstPath</code></a> will try to tokenize a path string based on options object specified as the second argument.

```typescript
type InferPathOptions = {
    devicePath: boolean; // parse string as dos device path
    unc: boolean; // parse string as unc path
    dos: boolean; // parse string as traditional dos path
    posix: boolean; // parse string as unix path
}
```

Multiple path types _can_ be tokenized from the same path string.

The response of <a href="#fn-all-path"><code>allPath</code></a> will be an <b>array</b> of `ParsedPath` <b>or/and</b> <a href="#parsed-path-error"><code>ParsedPathError</code></a> class instance, representing parsing for multiple OS path types.

<h4 id="infer-path-options-defaults">defaults:</h4>

If <a href="#infer-path-options"><code>InferpathOptions</code></a> argument is left empty in <a href="#fn-all-path"><code>allPath</code></a> and <a href="#fn-first-path"><code>firstPath</code></a> the default will be used based on OS:

- The default for windos: <code>{ dos: true, devicePath: true, unc: true, posix: false }</code>
- The default for unix: <code>{ posix: true }</code>

<h3 id="parsed-path"><code>ParsedPath</code> object</h3>

The response of a successfull path tokenization will be an ADT: `ParsedPath`.

An instance of `ParsedPath` has the following fields/members

- members:
    - <code>toString(): <i>string</i></code>: return the original path string
    - <code>isRelative(): <i>boolean</i></code>: is the a path a relative one?
- fields:
    - <code>type: <i>string</i></code>: one of the value `devicePath`, `unc`, `dos`, `posix`.
    - <code>path: <i>FileToken[]</i></code>: the path tokenized (see source).

<h3 id="parsed-path-error"><code>ParsedPathError</code> object</h3>

If a path has illigal characters or is invalid the result of a tokenization will be an ADT: <code>ParsedPathError</code>

- members:
    - <code>toString(): <i>string</i></code>: algamation of all errors found during parsing.
- attributes:
    - <code>type: <i>string</i></code>: one of the values `devicePath`, `unc`, `dos`, `posix`.
    - <code>path: <i>FileToken[]</i></code>: the path tokenized.


<h3 id="path-type-order-of-evaluation">Path type order of evaluation</h4>

When a string is parsed it will be evaluated according to path types in the following order:

1. `devicePath` tokanization will be tried first (if the `devicePath` boolean is set to true).
2. `unc` tokanization will be tried second, (if the `devicePath` boolean is set to true).
3. `dos` tokanization will be tried third, (if the `dos` boolean is set to true).
4. `posix` tokanization will be tried forth, (if the `posix` boolean is set to true)

<h3 id="path-token-type"><code>PathToken</code> object</h3>

You dont create `PathToken`s yourself the api will do it for you.

```typescript
class PathToken {
	value: string; // actual path fragment (directory, seperator, or file)
	start: number; // start location in the original string
	end: number; // end (inclusive) in the original string
    error?: string; // this token has invalid character for the OS selected
    isRoot(): boolean; // is this token a Root Token (c:/,  /, //?/UNC/Server/share, etc)
    isPathElement(): boolean; // a normal path element
    isCurrent(): boolean; // token representing "./"
    isParent(): boolean // token representing "../"
    isSeperator(): boolean // token representing "/" (posix) or "\" (windows, dos)
    hasError(): boolean // did tokenizing the path associated an error with this token
}
```

<h3 id="api-functions">Functions</h3>

<h4 id="fn-all-path">function: <code>allPath</code></h4>

```typescript
function allPath(path = '', options: InferPathOptions = {}): (ParsedPath | ParsedPathError)[];
```

<h5 id="fn-all-path-arguments">Arguments:</h5>

- <code>path: <i>string</i> optional</code>: (<b>Default</b> is current working directory). Relative or absolute <code>path</code> conforming to one of the <a href="#supported-path">supported path types</a>.
- <code>options: <i>InferPathOptions</i> optional</code>: Parsing limited to flags set to <code>true</code> in <a href="#infer-path-options">options</a>.

<h5 id="fn-all-path-return">Return:</h5>

- An Array that is:
    - empty (<code>path</code> is not one of the <a href="#supported-path">path types</a>)
    - contains <a href="#parsed-path"><code>ParsedPath</code></a> and in case of errors <a href="#parsed-path-error"><code>ParsedPathError</code></a> objects. 

<h5 id="fn-all-path-examples">Examples:</h5>

```typescript
import { allPath  } from '@mangos/filepath';

// will attempt to tokenize the path according to dos and unc path types
const paths = allPath('//system07/c$/x/y', { dos: true, unc: true });

// unc is the only possible match
paths.length
// -> 1
paths[0].type
// -> unc
path[0].toString()
// -> \\system07\c$\x\y or '\\\\system07\\c$\\x\\y' with \ escaped
```

<h4 id="fn-first-path">function: <code>firstPath</code></h4>

```typescript
function firstPath(path = '', options: InferPathOptions = {}): ParsedPath | ParsedPathError | undefined;
```

<h5 id="fn-first-path-arguments">Arguments:</h5>

- <code>path: <i>string</i> optional</code>: (<b>Default</b> is current working directory). Relative or absolute <code>path</code> conforming to one of the <a href="#supported-path">supported path types</a>.
- <code>options: <i>InferPathOptions</i> optional</code>: Parsing limited to flags set to <code>true</code> in <a href="#infer-path-options">options</a>.

<h5 id="fn-all-path-return">Return:</h5>

- <code>undefined</code>: The path was not confirm to any of the types listed in <a href="#supported-path">path types</a>

- <a href="#parsed-path"><code>ParsedPath</code></a>: In case of successfull parse.
- <a href="#parsed-path-error"><code>ParsedPathError</code></a>: In case of legal structure but illegal characters in the path.


<h4 id="fn-resolve-path-object">function: <code>resolvePathObject</code></h4>

```typescript
function resolvePathObject(from: ParsedPath, ...toFragments: string[]): ParsedPath;
```

<h5 id="fn-resolve-path-object-arguments">Arguments:</h5>

- <code>from: <i>ParsedPath</i></code>: A previously created <code><a  href="#parsed-path">ParsedPath</a></code> object via <a href="#fn-first-path"><code>firstPath</code></a> function. 
- <code>toFragments: <i>string[]</i></code>: A sequence of paths or path segments.

<h5 id="fn-resolve-path-object-return">Return:</h5>

- <a href="#parsed-path"><code>ParsedPath</code></a>: In case of successfull resolve.

<h5 id="fn-resolve-path-object-throws">throws:</h5>

- If <code>from</code> is a <a href="#parsed-path-error"><code>ParsedPathError</code></a> an `Error` will be thrown.
- If any of the `toFragments` is an invalid path an Error will be thrown.

<h4 id="fn-resolve">function: <code>resolve</code></h4>

```typescript
function resolve(fromStr: string, ...toFragments: string[]): ParsedPath;
```

<h5 id="fn-resolve-arguments">Arguments:</h5>

- <code>fromStr: <i>string</i> optional</code>: A path according to a <a href="#supported-path">path type</a>. Defaults to current working directory if absent/undefined.
- <code>toFragments: <i>string[]</i></code>: A sequence of paths or path segments.

<h5 id="fn-resolve-return">Return:</h5>

- <a href="#parsed-path"><code>ParsedPath</code></a>: In case of successfull resolve.

<h5 id="fn-resolve-throws">throws:</h5>

If <code>fromStr</code> is invalid a <a href="#parsed-path-error"><code>ParsedPathError</code></a> an `Error` will be thrown.

<h2>License</h2>

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

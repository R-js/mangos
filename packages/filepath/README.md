
<h1>filepath tokenizer</h1>

<h2 id="synopsis">Synopsis</h2>

_Part of the monorepo [mangos][mangos-mono-repo]_

- Tokenizes filepath string into its consituants;
- Preserves correctly (node `resolve` does not) the root of _dos device path_ and _unc path_.
- Provides utilities to work with different path types irrespective of OS used.

<h2 id="supported-path">Supported Paths</h2>

- [Microsoft dos device path][ddp]
- [UNC path][unc]
- [Traditional DOS path][tdp]
- [Unix path][posix]

<h2 id="ddp-failure">Node <code>resolve</code> does not preserve root of <a href="https://docs.microsoft.com/en-us/dotnet/standard/io/file-path-formats#dos-device-paths"<i>DOS Device Path</i></a></h2>

_Note: `\` needs to be escaped when using it in js code._

```javascript
// node  
> path.resolve('\\\\?\\C:\\repos','../../../text.txt');
// -> \\?\text.txt  \\?\C: is mangled

// filePath
> fp.resolve('\\\\?\\C:\\repos','../../../text.txt').toString();
// -> '\\?\C:\text.txt'  aka'\\?\C:\' root is preserved
```

<h2 id="unc-failure"> Node <code>resolve</code> does not (always) preserve root of <a href="https://learn.microsoft.com/en-us/dotnet/standard/io/file-path-formats#unc-paths"><i>UNC Path</i></a></h2>

_Note: `\` needs to be escaped when using it in js code._

```javascript
// node resolve
path.resolve('//?/UNC/Server/share', '../../../txt');
// -> '\\\\?\\txt'  mangled unc loot

// this library
filePath.resolve('//?/UNC/Server/share', '../../../txt').toString();
// -> '\\\\?\\UNC\\Server\\share\\txt'  unc root preserved
// -> root: \\\\?\\UNC\\Server\\share

path.resolve('//system07/c$/x/y', '../../../../../txt');
// -> '\\\\system07\\c$\\txt' unc root preserved 

fp.resolve('//system07/c$/x/y', '../../../../../txt').toString()
// -> '\\\\system07\\c$\\txt' unc root is preserved
```

<h2 id="api">Api</h2>

<h3 id="api-overview">Overview</h3>

There are 4 exported functions:

```typescript
import { allPath, firstPath, resolve, resolvePathObject } from '@mangos/filepath';
```

There are 2 exported classes:

```typescript
import { ParsedPath,  ParsedPathError, PathToken } from '@mangos/filepath';
```

There is 1 exported enum:

```typescript
import { PathTokenEnum } from '@mangos/filepath'
```

There is 1 exported type:

```typescript
import type { InferPathOptions } from '@mangos/filepath'
```

Most of the time you will be using <a href="#fn-resolve"><code>resolve</code></a>, <a href="#fn-first-path"><code>firstPath</code></a>.

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

Multiple path types <i>can</i> be tokenized from the same path string.

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
    token: PathTokenValueType;
	value: string; // actual path fragment (directory, seperator, or file)
	start: number; // start location in the original string
	end: number; // end (inclusive) in the original string
    error?: string; // this token has invalid character for the OS selected
    isRoot(): boolean; // is this token a Root Token (c:/,  /, //?/UNC/Server/share, etc)
    isPathElement(): boolean; // a normal path element
    isCurrent(): boolean; // token representing "./"
    isParent(): boolean // token representing "../"
    isSeperator(): boolean // token representing "/" (posix) or "\" (windows, dos)
}
```

The `PathTokenValueType` match the exported `PathTokenEnum` object

```typescript
export const PathTokenEnum = {
	SEP: '\x01',       // path seperator
	ROOT: '\x03',      // the root (if it is an absolute path)
	PATHELT: '\x06',   // directory, file, 
	PARENT: '\x07',    // two dots (..) meaning parent directory
	CURRENT: '\x08',   // a single dot (.) meaning current directory
} as const;
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


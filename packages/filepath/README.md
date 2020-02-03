
# filepath

filepath tool is to analyze and manipulate (join, validate and infer os path types) filepath based on the string value.


It handles the following paths types:

| path type    | description                                                                            |
|--------------|----------------------------------------------------------------------------------------|
| `unc`        | microsoft unc filepath                                                                 |
| `dos`        | traditional doth path                                                                  |
| `devicePath` | dos device path, alos allowing for dos devicepath descibing UNC `//./UNC/Server/Share` |
| `posix`      | posix path                                                                             |


Works in browser and in node.

```bash
npm install @mangos/filepath
```

`filepath` module has 3 named exports.

```javascript
const {  inferPathType, lexPath,  resolve } = require('@mangos/filepath');

// rest of your code
```

| function        | description                                                                           |
|-----------------|---------------------------------------------------------------------------------------|
| `inferPathType` | guess the os file type based on the path string purely, multiple matches are possible |
| `lexPath`       | lexer for path string, returns token array representing the path value                |
| `resolve`       | akin to nodejs `path.resolve`, respecting `unc` , `unc_long` and `device path` roots  |


## `inferPathType(path[, options])`

- `path` [string][string] File path
- `options` [Object][object]
    - `unc`: [boolean][boolean] interperet (if possible) the `path` as a `unc` pathname, if it is not possible there will be no `unc` entry in the return value object.
    - `dos`: [boolean][boolean] interperet (if possible) the `path` as a TDP (Traditional dos Path)
    - `devicePath`: [boolean][boolean] interperet (if possible) the `path` as a DDP ([Dos Device Path](#ddp)).
    - `posix`: [boolean][boolean] interpret (if possible) the `path` as a [UNIX devivce path][posix]. 
- Returns: [iterator < inferPathObject >](#inferpathobject) an Iterator returning valid interpretations (plural) of the `path` the most likely file types first.

```javascript
const { inferPathType } = require('@mangos/filepath');

const iterator = inferPathType('\\\\?\\unc\\c:/Users'); // Note: in JS you need to escape backslashes \\

let value, done;

{ value, done } = iterator.next(); // most likely path type
//-> done = undefined.
//-> value =
/*
{
    devicePath:{
        path: [ 
            { 
              token: '\u0005',  // token for the root element of a "devicePath" 
              value: '\\\\?\\UNC\\c:\\Users',  //-> normalized path
              start: 0,
              end: 15 
            } 
        ] 
    } 
}
*/
{ value, done } = iterator.next(); // less likely type path
// -> next possible interpretation for the string
```

## `lexPath([path[,options]])`

`LexPath` chooses the most likely (even if there are more interpertations of the `path` arguments) path type interpretation.

- `path` [string][string] File path.
- `options` [Object][object]
    - unc: [boolean][boolean] interperet (if possible) the path as a unc pathname, if it is not possible there will be no unc entry in the return value object.
    - dos: [boolean][boolean] interperet (if possible) the path as a TDP (Traditional dos Path)
    - devicePath: [boolean][boolean] interperet (if possible) the path as a DDP (Dos Device Path).
    - posix: [boolean][boolean] interpret (if possible) the path as a UNIX devivce path.
- Returns: Object of type [lexPathObject](#lexpathobject). 


Example 1:

```javascript
const { lexPath } = require('@mangos/filepath');

const result = lexPath('c:/hello/world'); // the function is agnostic to '\' or '/' tokens
// ->
/*
{ path:
   [ { token: '\u0003', value: 'c:', start: 0, end: 1 },   
     { token: '\u0001', start: 2, end: 2, value: '\\' },   
     { token: '\u0006', start: 3, end: 7, value: 'hello' },
     { token: '\u0001', start: 8, end: 8, value: '\\' },
     { token: '\u0006', start: 9, end: 13, value: 'world' } ],
  type: 'dos' 
*/
```

Example 2:

```javascript
const { lexPath } = require('@mangos/filepath');

const result = lexPath('//Server1/share/file.txt'); // the function is agnostic to '\' or '/' tokens
// ->
/*
{ 
    type: 'unc',
    path: [ 
        { token: '\u0004', value: '\\\\Server1\\share', start: 0, end: 14 },
        { token: '\u0001', start: 15, end: 15, value: '\\' },
        { token: '\u0006', start: 16, end: 23, value: 'file.txt' } 
   ]
}
*/
```

## `resolve([...paths])`
 
Resolve will work exactly like `path.resolve` but with these difference: It will respect the `devicePath` roots including the `Server` and `share` parts aswell. aka `//./unc/server/share` will seen as a root in totality.

- `...paths` [string][string] A sequence of file path or paths segments, the sequence can be empty (returns current working directory)
- Returns: [pathTokenArray](#inferpathobject). Simular to the [`inferPathType`](#inferpathtypepath-options) but returns a single answer, the most likely path type.

## Types

### `Token-ID`

The path lexer produces pieces of the string filepath as tokens, this is a list of all the lexer tokens

| token      | value (token id) | descriptions                                  | example                                            |
|------------|------------------|-----------------------------------------------|----------------------------------------------------|
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
    error: string; // it this token contains errors (like forbidden charactes in dos paths)
    token: string; // single character `\u0001` between `\u0008`
}
```

For the `token` values, see this [list](#token-id)


### `PathType`

A representation of a sting path with an array of tokens

```typescript
interface PathType { 
    path: Token[];
    firstError?: string; // the first error in the "path" array of tokens.
}
```

Return type of function [inferPathType][#inferpathtypepath-options]

### `inferPathObject`

The function [inferPathType](#inferpathtypepath-options) returns an iterator emitting values of type `inferPathObject`

```typescript
interface inferPathObject {
    posix?: PathType;
    unc?: PathType;
    dos?: PathType;
    devicePath?: PathType;
}
```

### `lexPathObject`

The function [lexPath](#lexpathpathoptions) returns this single instance of this type

```typescript
interface lexPathObject {
    type: 'dos'||'posix'||'devicePath'||'unc';
    path: PathType;
    firstError?: string; // the first error in the "path" array of tokens.
}
```

### `resolvePathObject`

The function [resolve](#)



[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type
[ddp]: https://docs.microsoft.com/en-us/dotnet/standard/io/file-path-formats#dos-device-paths
[tdp]: https://docs.microsoft.com/en-us/dotnet/standard/io/file-path-formats#traditional-dos-paths
[posix]: https://pubs.opengroup.org/onlinepubs/009695399/basedefs/xbd_chap03.html#tag_03_266
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object



# filepath

filepath tool is to analyze and manipulate (join, validate and infer os path types) filepath based on the string value.

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


## `inferPathType((path[, options])`

- `path` [string](#string) File path
- `options` [Object]
    - `unc`: [boolean](#boolean) interperet (if possible) the `path` as a `unc` pathname, if it is not possible there will be no `unc` entry in the return value object.
    - `dos`: [boolean](#boolean) interperet (if possible) the `path` as a TDP (Traditional dos Path)
    - `devicePath`: [boolean](#boolean) interperet (if possible) the `path` as a DDP ([Dos Device Path](#ddp)).
    - `posix`: [boolean](#boolean) interpret (if possible) the `path` as a [UNIX devivce path](#posix). 
- Returns: [iterator<inferPathObject>](#infer-path-object) an Iterator returning valid interpretations (plural) of the `path` the most likely file types first.

```javascript
const { inferPathType } = require('@mangos/filepath');

const iterator = inferPathType('\\\\?\\unc\\c:/Users'); // Note: escape backslash with backslash

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
// done = false
// -> value = (contain errors see below)
/*
{
    dos: {
        path:[
            .
            .
        ]

    }
}
*/
```

## `lexPath([path[,options]])`

- `path` [string](#string) File path.
- `options` [Object](#option-object) A set of options used to guide the infer path types.
- Returns: [inferPathObjectSingle](#infer-path-object-single). Simular to the [`inferPathType`](#inferpathtypepath-options) but returns a single answer, the most likely path type.

## `resolve([fromPath[,toPath1[, toPath2[,...[, toPathN]]]])`

- `fromPath` [string](#string) File path.
- `toPath1` [string](#string) File path.
- `toPath2` [string](#string) File path.
- `toPathN` [string](#string) File path.
- Returns: [pathTokenArray](#infer-path-object-single). Simular to the [`inferPathType`](#inferpathtypepath-options) but returns a single answer, the most likely path type.

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
    token: 
}
```

### `PathType`


### `inferPathObject`

The function [inferPathType](#inferpathtypepath-options) returns an iterator emitting values of type `inferPathObject`

```typescript
interface inferPathObject {
    posix?: PathType;
    unc?: PathType;
    dos?: PathType;
    devicePath?: PathType;
};
```

Toke

### `pathTokenArray`

Return value of [`resolve`](#resolvefrompathtopath1-topath2-topathn)


## `Tokens`



[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type
[ddp]: https://docs.microsoft.com/en-us/dotnet/standard/io/file-path-formats#dos-device-paths
[tdp]: https://docs.microsoft.com/en-us/dotnet/standard/io/file-path-formats#traditional-dos-paths
[posix]: https://pubs.opengroup.org/onlinepubs/009695399/basedefs/xbd_chap03.html#tag_03_266
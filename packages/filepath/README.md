
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
- `options` [Object](#option-object) A set of options used to guide the infer path types
- Returns: [inferPathObject](#infer-path-object) list of path interpretations (accourding to type) of the given `path`

```javascript
const { inferPathType } = require('@mangos/filepath');


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

### `inferPathObject`

Return value of [inferPathType](#inferpathtypepath-options)
<!-- the link above is from github -->

```typescript


```

### `pathTokenArray`



## `Tokens`



[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type

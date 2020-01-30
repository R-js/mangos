
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


## `inferPathObject`

Return value of [inferPathType](#option-object)


```typescript


```

## `Tokens`



[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type


# JXPath

JXPath is a query langauge for JavaScript Objects (parsed JSON).

Enhancements over jsonpath include:
 - parent operator `../`
 - query using regular expressions (on both property names and their values)
 - recursive descent operator `**`
 - lazy tree walking

```bash
npm install @mangos/jxpath
```
## Query operators overview

| operator            | jxpath            | example                                                       |
| ------------------- | ----------------- | ------------------------------------------------------------- |
| `literal_text`      | exact selector    | `/persons/adress/city`                                        |
| `..`                | parent selector   | `/persons/adress/[zip=/$FL/]/../firstName`                    |
| `**`                | recursive descent | `[/employees/**/[name=Clark Kent]/address`                    |
| `[key=value]`       | predicate         | `[city=London]`, `[city=/town$/]`, `[/name$/=/^Smith/]`       |
| `[regexp1=regexp2]` | regexp predicate (including regexp flags)  | `[city=/town$/igm]`, `[/name$/=/^Smith/]`, `[/name$/=Mr Dubois]` |

**Note: more operators will be implemented, create an issue if you have an idea for a novice operator**

Query _"path"_ elements are seperated by `/` token and predicates are enclosed between `/[`  `]/` tokens.

JXPath alaws returns a array of values/objects, if nothing was selected by the query the array will be empty.

JXPath navigates through arrays and objects agnosticly.

Look the the following JS object:

```javascript
const data = {
    manager: {
        firstName: 'Big',
        lastName: 'Boss'
    }
    employees: [ 
        {
            firstName: 'Tammy',
            lastName: 'Brant',
            address: {
                zip: 'AL 36104'
                city: 'Calumet City',
                street: '837 West St.'
            }
        },
        {
            firstName: 'Roy',
            lastName: 'White',
            address: {
                zip: 'AL 36487',
                city: 'Tullahoma',
                street: '843 Golden Star Avenue'
            }
        },
        {
            firstName: 'James',
            lastName: 'Kirk',
            address: {
                zip: 'FL 32301',
                city: 'Jackson Heights',
                street: '572 Myrtle Avenue'
            }
        }
    ]
};
const  path =  // see examples below
const jxpath = require('@mangos/jxpath');
const iterator = jxpath( path , data); // returns iterator, lazy lexing
console.log( Array.from( iterator );
//-> result , see below
```

The `/employees/` is an array of objects, and `/manager` is single nested object, JXPath query treats them both agnosticly.

## Predicate `[..]` query selector

Predicates have the general pattern `/[key=value]/`; both `key` and `value` can be regular expressions

### regular expression predicates

The regular expresion predicate will take flags `igmsuy` after the last regexp delimiter `/`.

* A path of `/employees/[firstName=/(Tammy|Roy)/]/lastName` would return the the lastNames: `[ 'Brant', 'White' ]` omitting `Kirk`.
* A path of `/employees/[/Name$/=/.*/]/firstName` would return the first-and lastNames combined: `[ 'Tammy', 'Brant' , 'Roy' , 'White' , 'James' , 'Kirk' ]`
* A path of `/manager/[/Name$/i=/^B/i]` (not the use of the `i` flag) will return the object value `manager` since both `firstName` and `lastName` match the left side expression and both values start with the upperCase `B` (or lowerCase `b` because of the use of flag `i`).

### literal predicates

* A path of `/manager/firstName` returns the result `[ 'Big' ]`.
* A path of `/employees/firstName` returns the result `[ 'Tammy', 'Roy', 'James' ]`.
* A path of `/employees/non-existant-path` returns an empty result `[]`.

## Parent selector

A parent selector is the two dots `..` as it is in XPath.

* A path of `/employees/address/[zip=/^AL/]/../firstName` will give back the result `[ 'Tammy', 'Roy', ]`, aka all first names of employees having a zipcode starting with `AL`.

## Recursive descent selector

A recursive descent selector is the `**` as it is in XPath.

* A path of `/**/zip` will give back the zip prop values in the JS object (descending through objects or array of objects). Result `['AL 36104','AL 36487', 'FL 32301']`.


## Functional 

Can use jxpath in a curried fashion

```javascript
const  path =  // see examples 
const jxpath = require('@mangos/jxpath');

const curry = jxpath( path ); // curried 

const iterator = curry(data); // process data, re-use the curried version
```

## Ignore property names 

Can use jxpath can ignore properties (especially handy if the object has circular references).
- The third argument in the `jxpath` is a singular field containing the name of the property to ignore (recursivly found in objects).
- The second argument in the curried form of `jxpath` is a singular field containing the name of the property to ignore (recursivly found in objects).

```javascript
const  path =  '**/[city=New York]/../firstName';
const jxpath = require('@mangos/jxpath');

// curried form
const curry = jxpath( path ); // curried 
const iterator = curry(data, 'parent' ); // ignore "parent" property when doing recursive descent

// non curried form
const iterator = jxpath( path, data, 'parent' ); // ignore "parent" property when doing recursive descent
```

_Support the work by starring this [repo](https://github.com/R-js/mangos) on github.
_Part of the [mangos](https://github.com/R-js/mangos) monorepo of data wrangling tools._

## Feedback

We appreceate any feedback, with new ideas, to enhance this tool suite. File an issue [here](https://github.com/R-js/mangos/issues)

Before contributing, please read our contributing [guidelines](CODE_OF_CONDUCT.md) and [code of conduct](CONTRIBUTING_GUIDELINES.md).

## [License](LICENSE)

Copyright (c) 2019-2020 Jacob Bogers `info@mail.jacob-bogers.com`.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

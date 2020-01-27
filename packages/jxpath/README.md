
# JXPath

_Part of the [mangos](https://github.com/R-js/mangos) monorepo of data wrangling tools._

JXPath is an adaption of XPath query language for XML, but applied to JS objects (hidrated from json or yaml files).

_Support the work by starring this [repo](https://github.com/R-js/mangos) on github.

```bash
npm install @mangos/jxpath
```

### Differences with XPath

JS Objects (unlike XML) dont have attributes. This means JXPath query language omits XPath constructs that select attributes.

### Differences with json-path

- `jxpath` has a parent operater `/../` unavailable in `json-path`, in json-path the `/../` this is a recursive descent operator
- `jxpath` has full regular expression to select for both property names and property values

## Query operators overview

| operator            | jxpath           | example                                                        |
| ------------------- | ---------------- | -------------------------------------------------------------- |
| `literal_text`      | exact selector   | `/persons/adress/city`                                         |
| `..`                | parent selector  | `/persons/adress/[zip=/$FL/]/../firstName`                     |
| `[key=value]`       | predicate        | `[city=London]`, `[city=/town$/]`, `[/name$/=/^Smith/]`        |
| `[regexp1=regexp2]` | regexp predicate | `[city=/town$/]`, `[/name$/=/^Smith/]`, `[/name$/=Mr Dubois]` |

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
const result = jxpath( path , data);
//-> result , see below
```

The `/employees/` is an array of objects, and `/manager` is single nested object, JXPath query treats them both agnosticly.

## Predicate `[..]` query selector

Predicates have the general pattern `/[key=value]/`; both `key` and `value` can be regular expressions

### regular expression predicates

* A path of `/employees/[firstName=/(Tammy|Roy)/]/lastName` would return the the lastNames: `[ 'Brant', 'White' ]` omitting `Kirk`.
* A path of `/employees/[/Name$/=/.*/]/firstName` would return the first-and lastNames combined: `[ 'Tammy', 'Brant' , 'Roy' , 'White' , 'James' , 'Kirk' ]`
* A path of `/manager/[/Name$/=/^B/]` will return the object value `manager` since both `firstName` and `lastName` match the left side expression and both values start with the capital letter `B`.

### literal predicates

* A path of `/manager/firstName` returns the result `[ 'Big' ]`.
* A path of `/employees/firstName` returns the result `[ 'Tammy', 'Roy', 'James' ]`.
* A path of `/employees/non-existant-path` returns an empty result `[]`.

## Parent selector

A parent selector is the two dots `..` as it is in XPath.

* A path of `/employees/address/[zip=/^AL/]/../firstName` will give back the result `[ 'Tammy', 'Roy', ]`, aka all first names of employees having a zipcode starting with `AL`.

## Feedback

We appreceate any feedback, with new ideas, to enhance this tool suite. File an issue [here](https://github.com/R-js/mangos/issues)

Before contributing, please read our contributing [guidelines](CODE_OF_CONDUCT.md) and [code of conduct](CONTRIBUTING_GUIDELINES.md).

## [License](LICENSE)

Copyright (c) 2019-2020 Jacob Bogers `info@mail.jacob-bogers.com`.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

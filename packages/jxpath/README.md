
# JXPath

[release notes](CHANGELOG.md)

```bash
npm install @mangos/jxpath
```

_Part of the [mangos](https://github.com/R-js/mangos) monorepo of data wrangling tools._

JXPath is an adaption of XPath query language for XML, but applied to JS objects (hidrated from json or yaml files).

JS Objects (unlike XML) dont have attributes or namespaces, or comments `<!-- >`. This means JXPath only handles `string` property names who's values that can be any JS R-value.

_Support the work by starring this [repo](https://github.com/R-js/mangos) on github.

## Query langauge

The JXPath query langauge (like XPath) uses a _path like_ syntax to indentify and navigate nodes in a JS object. 
Query _"path"_ elements are seperated by `/` token and predicates are enclosed between `/[`  `]/` tokens.

JXPath alaws returns a array of values/objects, if nothing was selected by the query the array will be empty.

## _Literal_ query selector

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
            firtName: 'Roy',
            lastName: 'White',
            address: {
                zip: 'AL 36487',
                city: 'Tullahoma',
                street: '843 Golden Star Avenue'
            }
        },
        {
            firtName: 'James',
            lastName: 'Kirk',
            address: {
                zip: 'FL 32301',
                city: 'Jackson Heights',
                street: '572 Myrtle Avenue'
            }
        }
    ]
};

const jxpath = require('@mangos/jxpath');
const result = jxpath( path , data); // -> example of paths are given below
//-> result , see below
```

* A path of `/manager/firstName` returns the result `[ 'Big' ]`.
* A path of `/employees/firstName` returns the result `[ 'Tammy', 'Roy', 'James' ]`.
* A path of `/employees/non-existant-path` returns an empty result `[]`.

`/employees/` is an array of objects and `manager` is a nested object, JXPath query treats them both agnosticly.


## Predicate _literal_ query selector

Predictes within a query _path_ can be used so omit/select intermediate JS object nodes.

Using the previous JS object:

- A path of `/manager/[firstName=Big]` will return the result 

```javascript
[
    {
        firstName: 'Big',
        lastName: 'Boss'
    }
]
``` 
A path of `/manager/[firstName=Big]/lastName` will return the result `[ 'Boss' ]`.

## Predicate _regular expression_ query selector

Predicates have the general pattern `/[key=value]/`; both `key` and `value` can be regular expressions
Because the Path `/` seperator is used to delimit a regular expression aswell, it must be escaped when using it with a regexp predicate

A regexp of `/^Tamm[a-z]$/` would need to be escaped as `\\/^Tamm[a-z]$\\/`. You cannot use modifier flags in regexp (aka `i`, `g`, etc)


* A path of `/employees/[firstName=\\/(Tammy|Roy)\\/]/lastName` would return the the lastNames: `[ 'Brant', 'White' ]` omitting `Kirk`.
* A path of `/employees/[\\/Name$\\/=\\/.*\\/]/firstName` would return the first-and lastNames combined: `[ 'Tammy', 'Brant' , 'Roy' , 'White' , 'James' , 'Kirk' ]`
        
## Predicate _parent_ query selector

A parent selector is the two dots `..` as it is in JXPath.

* A path of `/employees/address/[zip=\\/^AL\\/]/../firtName` will give back the result `[ 'Tammy', 'Roy', `, aka all first names of employees having a zipcode starting with `AL`.

## Feedback

We appreceate any feedback, with new ideas, to enhance this tool suite. File an issue [here](https://github.com/R-js/mangos/issues)

Before contributing, please read our contributing [guidelines](CODE_OF_CONDUCT.md) and [code of conduct](CONTRIBUTING_GUIDELINES.md).


## [License](LICENSE)

Copyright (c) 2019-2020 Jacob Bogers `info@mail.jacob-bogers.com`.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.






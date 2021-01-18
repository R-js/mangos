# mangos

🥭🥭 A monorepo collecting data wrangling and data validation utilities.


The current collection of tools is listed below, new tools are planned for the future, create an [issue](issues) to propose new features, new tools, and/or bug findings.

Support this repo by ⭐ starring it.

**Table of Contents**
- [mangos](#mangos)
  - [JXPath](#jxpath) xpath for js objects.
  - [filepath](#filepath) filepath tool to join and analyze paths of type `UNC`, `MS traditional`, `MS Device path`, and `Posix`.

# JXPath

[Full APi doc](packages/jxpath/README.md)

JXPath is an adaption of XPath query language for XML, but applied to JS objects (hidrated from json or yaml files).

```bash
npm install @mangos/jxpath
```

### Differences with XPath

JS Objects (unlike XML) dont have attributes. This means JXPath query language omits XPath constructs that select attributes.

### Differences with json-path

- `jxpath` is very efficient slicing extreemly large JS objects without creating intermediate results (its a generator function returning an iterator, aka "just in time"/"lazy" slicing of the JS object data).
- `jxpath` has a parent operater `/../` unavailable in `json-path`, in json-path the `/../` this is a recursive descent operator
- `jxpath` has full regular expression to select for both property names and property values

## Query operators overview

| operator            | jxpath                                    | example                                                        |
| ------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `literal_text`      | exact selector                            | `/persons/adress/city`                                         |
| `..`                | parent selector                           | `/persons/adress/[zip=/$FL/]/../firstName`                     |
| `**`                | recursive descent                         | `[/employees/**/[name=Clark Kent]/address`                     |
| `[key=value]`       | predicate                                 | `[city=London]`, `[city=/town$/]`, `[/name$/=/^Smith/]`        |
| `[regexp1=regexp2]` | regexp predicate (including regexp flags) | `[city=/town$/i]`, `[/name$/=/^Smith/]`, `[/name$/=Mr Dubois]` |

**Note: more operators will be implemented, create an issue if you have an idea for a novice operator**

Query _"path"_ elements are seperated by `/` token and predicates are enclosed between `/[`  `]/` tokens.

JXPath alaws returns a array of values/objects, if nothing was selected by the query the array will be empty.

JXPath navigates through arrays and objects agnosticly.

### JXPath query examples

Below is an exmaple snippet of a database as a JS object.

_Note: Imagine the more data in places  you see `...` in the snippet below._

```javascript
const data = {
    'customers': [
    {
        id: 1,
        email: 'tammy.bryant@internalmail',
        name: 'Tammy Bryant',
        orders: [
            {   
                date: '04-FEB-2018 13.20.22',
                orderId: 1,
                store: {
                    id: 1,
                    name: 'Online',
                    web: 'https://www.example.com',
                },
                order_status: 'cancelled',
                quanitity: 35,
                unit_price: 42.01
            },
            {   
                date:'04-FEB-2018 13.25.31',
                orderId: 2,
                item: 'Pasteries Alexandertorte',
                store: {
                    id: 1,
                    name: 'Oberweissen Pie Bakery',
                    web: 'https://www.backery-r-us.com',
                    address:{
                        city:'seattle',
                        street: '1501 Fourth Avenue Suite 1000',
                        state: 'Seattle WA 98101'
                    }
                },
                order_status: 'cancelled',
                quanitity: 35,
                unit_price: 42.01
            }
            ...
            ...
        ]
    },
    {
        id: 2,
        email: 'roy.white@internalmail',
        name: 'Roy White'
        ...
        ...
    },
    {
        id: 25,
        email: 'walter.turner@internalmail',
        name: 'Walter Turner'
        ...
        ...
    },
]

```

Lets ask some simple questions/queries and see how to to use JXPath to slice and dice the JSON/JS Object

### Q1: show me the name of customers that have orders that are cancelled

**Answer:**

```javascript
    const jxpath = require('@mangos/jxpath');
    const iterator = jxpath('/customers/orders/[order_status=cancelled]/../name'); 
    //-> [ 'Tammy Bryant' ]
```

### Q2: show me the email of customers that have cancelled orders from online retailers

```javascript
    const jxpath = require('@mangos/jxpath');
    // using regular expression with flags "im" /www.backery-r-us.com/im  

    const iterator = jxpath('/customers/orders/[order_status=cancelled]/store/[web=/www.backery-r-us.com/im]/../../email');
    //-> [ 'tammy.bryant@internalmail' ]
```

### Q3: give me all customer names

```javascript
    const jxpath = require('@mangos/jxpath');
    const iterator = jxpath('/customers/name');
    //-> [ 'Tammy Bryant', 'Roy White', 'Walter Turner' ]
```

### Q4: Recursive descent the JS object and give me all `unit_price` (s).

```javascript
    const jxpath = require('@mangos/jxpath');
    const iterator = jxpath('/**/unit_price');
    //-> [ 'Tammy Bryant', 'Roy White', 'Walter Turner' ]
```


[Full Api Doc](packages/jxpath/README.md)


# filepath

This is a filepath parsing _(LL(1) parser)_ and manipulation tool. It returns a parse tree describing the file path.

[Full Api Doc](packages/filepath/README.md)

FilePath tool complements the nodejs `path` module, parsing the following path types.

| path type    | description                                                                            |
|--------------|----------------------------------------------------------------------------------------|
| `unc`        | microsoft unc filepath                                                                 |
| `dos`        | traditional doth path                                                                  |
| `devicePath` | dos device path, alos allowing for dos devicepath descibing UNC `//./UNC/Server/Share` |
| `posix`      | posix path                                                                             |


## Feedback

We appreceate any feedback, with new ideas, to enhance this tool suite. File an issue [here](https://github.com/R-js/mangos/issues)

Before contributing, please read our contributing [guidelines](CODE_OF_CONDUCT.md) and [code of conduct](CONTRIBUTING_GUIDELINES.md).

## [License](LICENSE)

Copyright (c) 2019-2020 Jacob Bogers `info@mail.jacob-bogers.com`.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

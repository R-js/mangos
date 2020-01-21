# mangos

🥭🥭 A monorepo collecting data wrangling and data validation utilities (release date jan 2020).


The current collection of tools is listed below, new tools are planned for the future, create an [issue](issues) to propose new features, new tools, and/or bug findings.

Support this repo by ⭐ starring it.

**Table of Contents**
- [mangos](#mangos)
  - [JXPath](#jxpath)
  - [JValidator](#jvalidator)

## JXPath

JXPath is an adaption of XPath, but applied to JS objects.

### Differences with XPath

JS Objects (unlike XML) dont have attributes. This means JXPath query language omits XPath constructs that select attributes.

```bash
npm install @mangos/jxpath
```

### Differences with json-path

- `jxpath` has a parent operater `/../` unavailable in `json-path`, in json-path the `/../` this is a recursive descent operator
- `jxpath` has full regular expression to select for both property names and property values

## Query operators overview

| operator            | jxpath           | example                                                        |
| ------------------- | ---------------- | -------------------------------------------------------------- |
| `..`                | parent selector  | `/persons/adress/[zip=/$FL/]/../firstName`                     |
| `[key=value]`       | predicate        | `[city=London]`, `[city=/town$/]`, `[/name$/=/^Smith/]`        |
| `[regexp1=regexp2]` | regexp predicate | `[city=/town$/]`, `[/name$/=/^Smith/]`, `[[/name$/=Mr Dubois]` |
| `literal_text`      | exact selector   | `/persons/adress/city`                                         |

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

* A path of `/employees/address/[zip=/^AL/]/../firstName` will give back the result `[ 'Tammy', 'Roy' ]`, aka all first names of employees having a zipcode starting with `AL`.

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
    const resultArray = jxpath('/customers/orders/[order_status=cancelled]/../name'); 
    //-> [ 'Tammy Bryant' ]
```

### Q2: show me the email of customers that have cancelled orders from online retailers

```javascript
    const jxpath = require('@mangos/jxpath');
    // using regular expression /.*/  

    const resultArray = jxpath('/customers/orders/[order_status=cancelled]/store/[web=/.*/]/../../email');
    //-> [ 'tammy.bryant@internalmail' ]
```

### Q3: give me all customer names

```javascript
    const jxpath = require('@mangos/jxpath');
    const resultArray = jxpath('/customers/name');
    //-> [ 'Tammy Bryant', 'Roy White', 'Walter Turner' ]
```

[Full Api Doc](packages/jxpath/README.md)


## JValidator 👷(under construction, release 2020 jan)

An extreemly intuitive `JOI like` (but easier to use) JS validator, with the following advantages:

- Easy to extend collection of build in validators with novice features
  - Ability to cross reference data (think foreign keys) within an object being validated
- Compose validators via chaining "dot" notation aka `V.IfFalsy(123).integer(4).optional`
- adding a validator via chaining to an existing validator creates a new validator instance: `V.float().integer()` is a different validator then `V.float()`.

[Full Api Doc](packages/validator/README.md)

Install:
```bash
npm install @mangos/jvalidator
```

### Extensive example

Lets say you opened up your online shoppingsite as an white-label API (SAAS) so that 2nd party whole-sellers/retailers can use your platform
ebay like website.

As online orders are submitted, you would need to validate the incomming JSON was generated correctly by the affiliate partner.

```javascript
// fictisous example ordering info
const data = {
    retailOutlets: [{
            name: 'radioshack', // normally use an ID of the store
            address: {
                streetName: 'E Main St, New Holland',
                zip: 'PA 17557',
                houseNr: 331
            }
        },
        {
            name: 'wallmart',
            address: {
                streetName: 'NJ-23 Riverdale',
                zip: 'NJ 07457',
                houseNr: 48,
                state: 'NJ'
            }
        }
    ],
    customers: [{
        name: 'Ms Betty DavenPort',
        deliveryAddress: {
            zip: 'NY 11236',
            streetName: 'Devonshire Dr.Brooklyn',
            houseNumber: 72
        },
        orderItems: [{
                id: 11184,
                category: 'food',
                item: 'apples',
                shop: 'WalMart', // references /retailOutlets/name
            },
            {
                id: 14114,
                category: 'electronics',
                item: 'AAA batteries',
                shop: 'radioshack' // references /retailOutlets/name
            },
            {
                id: 11945,
                category: 'electronics',
                item: 'AC Charger',
                shop: 'radioshack' // references /retailOutlets/name
            },
            {
                id: 11945,
                category: 'electronics',
                item: {
                    name: 'electric shaver'
                },
                shop: 'radioshack' // references /retailOutlets/name
            }
        ]
    }]
};
```

**note:** there is an internal referential constraint between `/retailOutlets/name` and `/customers/orderItems/shop`

### Modular approach

This exercise will show the modular re-use of `jvalidator` validators wich individually validate slices of the data structure and finally making a final validator capable of validating the whole `data` object.

#### step 1: Validating address information

When looking at the `data` object, we notice address information being used in `retailOutlets/address` and `customers/deliveryAddress`

We can specifiy an _address_ validator and re-use it several times when

```javascript
const { V } = require('@mangos/jsvalidator');      // included for clarity, do this only once

const checkAddress = V.object({
    streetname: V.string(4,50),                    // string must be between 4 and 50 characters in length
    zip:        V.regexp(/^[A-Z]{2}\s+[0-9]{5}$/), // US zipcode format, example "TN 12345"
    housNumber: V.integer(1),                      // a non zero integer,  ℕ/{0}
    state:      V.regexp(/^[A-Z]{2}$/).optional    // US "state" is a string of exactly length 2, the state property is an optional property
}).closed;

// test it
const [result, error] = checkAddress({
     streetName:'E Main St, New Holland',
     zip:'PA 17557',
     houseNr:331
});

//-> "error" will be undefined (otherwise an Error object wich usefull information)
//-> "result" will be the same as the input data, (in some cases sanitation could have taken place)  
```

#### step 2: Validate `customer.orderItems`

```javascript
const { V } = require('@mangos/jsvalidator');      // included for clarity, do this only once

const checkOrderItem = V.object({
     id:                  V.integer(1),                       // postive nonzero integer
     category:            V.enum('food','electronics'),       // the category value must exist in retailOutlets.name
     item:                V.string(1, 30),                    // must be a string of non-zero length and max length 30,
     shop:                V.ref('/retailOutlets/name').exist  // the category value must exist in retailOutlets.name
}).closed;                                                    // no other property names are allowed
```

#### step 3: Validate `customers`

```javascript
const { V } = require('@mangos/jsvalidator');      // included for clarity, do this only once

const checkSingleCustomer = V.object({
    name:             V.string(1),            // non empty string
    deliveryAddress:  checkAddress            // a previously defined validator (step 1)
    orderItems:       V.any(checkOrderItem)   // every element of "orderItem" but be validated by checkOrderItems validator (defined in step2)
}).closed;                                    // no other properties allowed in the object
```

#### step 4: define `retailOutlets` validator

```javascript
const { V } = require('@mangos/jsvalidator');      // included for clarity, do this only once

const checkOutlet = V.object({
    name:           V.string(1),                  // non-empty string
    address:        checkAddress                  // re-use previously defined address validator from "step 1".
}).closed;                                        // no other properties allowed in the object
```

#### step 5: putting it all together

```javascript
const { V } = require('@mangos/jsvalidator');      // included for clarity, do this only once

const checkData = V.object({
    retailOutlets:      V.any(checkOutlet),        // checkOutlet is defined in step 4
    customers:          V.any(checkSingleCustomer) // checkSingleCustomer is defined in step 3
}).closed;                                         // no other properties allowed in the object

const [result, errors] = checkData( data );        // data as defined in the USE CASE
//-> errors will be undefined or an array of errors specifiying a single validation failure
//-> result will be the same as data, if sanitizers are used (not used in this example) result will have been sanitized
```

## Feedback

We appreceate any feedback, with new ideas, to enhance this tool suite. File an issue [here](https://github.com/R-js/mangos/issues)

Before contributing, please read our contributing [guidelines](CODE_OF_CONDUCT.md) and [code of conduct](CONTRIBUTING_GUIDELINES.md).

## [License](LICENSE)

Copyright (c) 2019-2020 Jacob Bogers `info@mail.jacob-bogers.com`.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

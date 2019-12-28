# mangos

🥭🥭 A monorepo collecting data wrangling and data validation utilities (release date jan 2020).


The current collection of tools is listed below, new tools are planned for the future, create an [issue](issues) to propose new features, new tools, and/or bug findings.

Support this repo by ⭐ starring it.

**Table of Contents**
- [mangos](#mangos)
  - [JPath](#jpath)
  - [JValidator](#jvalidator)

## JPath

An easy and intuitive _XPath_ analog to slice 🔪 and dice Javascript objects. [#TLDR](packages/jpath/README.md)

## JValidator

An extreemly intuitive `JOI like` (but easier to use) JS validator, validates arrays and scalar values, including **the ability to internally cross reference data within Javascript objects**, extend existing validators, add new features to the validator dictionary and many more. [#TLDR](packages/validator/README.md)

#### install

```bash
npm install @mangos/jvalidator
```

#### Everything & the kitchen sink, example

##### USE CASE

Lets say you opened up your online shoppingsite as an white-label API (SAAS) so that 2nd party whole-sellers/retailers can use your platform
ebay like website.

As online orders are submitted, you would need to validate the incomming JSON was generated correctly by the affiliate partner.

```javascript
// fictisous example ordering info
const data = {
    retailOutlets:[
        {
            name:'radioshack', // normally use an ID of the store
            address: {
                streetName:'E Main St, New Holland',
                zip:'PA 17557',
                houseNr:331
            }
        },
        {
            name:'wallmart',
            address: {
                streetName: 'NJ-23 Riverdale',
                zip:'NJ 07457',
                houseNr:48,
                state: 'NJ'
            }
        }
    ]
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
                shop: 'WalMart',            // references /retailOutlets/name
            },
            {
                id: 14114,
                category: 'electronics',
                item: 'AAA batteries',
                shop: 'radioshack'          // references /retailOutlets/name
            },
            {
                id: 11945,
                category: 'electronics',
                item: 'AC Charger',
                shop:'radioshack'           // references /retailOutlets/name
            }
        ]
    }]
};

```

**note:** there is an internal referential constraint between `/retailOutlets/name` and `/customers/orderItems/shop`

#### Modular approach

This exercise will show the modular re-use of `jvalidator` validators wich individually validate slices of the data structure and finally making a final validator capable of validating the whole `data` object.

#### step 1: Validating address information

When looking at the `data` object, we notice address information being used in `retailOutlets/address` and `customers/deliveryAddress`

We can specifiy an _address_ validator and re-use it several times when

```javascript
const { V } = require('@mangos/jsvalidator');      // included for clarity do this only once

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


const outlets = V.object({
    retailOutlets: V.any(outlet)    // each individual item in "retailOutlets" array must comply with the "outlet" validator 
}).open                             // other object properties may exist, but will not be validated


const [result, error] = outlets(data); //
//-> error will be undefined,
//-> result will be the same as data
```

Any validator returns an array `[result, error]`, `result` might be a sanatized data, or equal to `data` input.
If the `error` is NOT `undefined`, this means the validation failed. `error` will be an `Error` instance.

#### step 2: create a validator for `customers.orderItems` nested object

```javascript

const checkOrderItem = V.object({
    id:         V.integer(1),                                   // a non-zero positive integer
    category:   V.enum(['food', 'electronics', 'clothing']),    // must be one of the 3 enums
    item:       V.string(1),                                    // any string of nonzero length,
    shop:       V.ref('../retailOutlets/name'),                 // internal reference, shop must be listed in "/retailOUtlets/name"
}).closed;

```

#### step 3: create a validator for `customers.deliveryAddress` property

**Note:** in step 1 we defined the address components for `retailOutlets` in a more realistic example one would seperate
_address information_ into an isolated validation object so it can be re-used in other objects defining address information.

```javascript

const checkdeliveryAddress = V.object({
     zip: 'NY 11236',
            streetName: 'Devonshire Dr.Brooklyn',
            houseNumber: 72
      
   }).closed
        },
        
}).closed;

```





Thinking about contributing? Read [guidelines](CODE_OF_CONDUCT.md) and [code of conduct](CONTIBUTING_GUIDELINES.md)

[issues]: https://github.com/R-js/mangos/issues

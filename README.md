# mangos

🥭🥭 A monorepo collecting data wrangling and data validation utilities.


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
            streetName:'E Main St, New Holland',
            zip:'PA 17557',
            houseNr:331
        },
        {
            name:'wallmart',
            address:'NJ-23 Riverdale',
            zip:'NJ 07457',
            houseNr:48
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
                category: 'groceries',
                item: 'apples',
                shop: 'WalMart',
            },
            {
                id: 14114,
                category: 'electronics',
                item: 'AAA batteries',
                shop: 'radioshack'
            },
            {
                id: 11945,
                category: 'electronics',
                item: 'AC Charger',
                shop:'radioshack'
            }
        ]
    }]
};

```

Now lets validte this structure, note also there is an internal referential constraint between:

`/retailOutlets/name` and `/customers/orderItems/shop`

create a validator for `retailOutlets`

```javascript
const { V } = require('@mangos/jsvalidator');

const outlet = V.object({
    name: V.string(5), // string must be minimally 5 characters in length
    streetname: V.string(4,50), // string must be between 4 and 50 characters in length
    zip: V.regexp(/^[A-Z]{2}\s+[0-9]{5}$/), // US zipcode format
    housNumber: V.toNumber.number(1 , 500) // a number between 1 and 500
});

const outlets = V.object({
    retailOutlets: V.array(outlet);
}).open

```



Thinking about contributing? Read [guidelines](CODE_OF_CONDUCT.md) and [code of conduct](CONTIBUTING_GUIDELINES.md)

[issues]: https://github.com/R-js/mangos/issues

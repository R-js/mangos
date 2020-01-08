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

- Slices through complex JS objects with optional predicates
    - example: _get all the firstName of all persons who live in new york city_ would like like `/persons/[city=new york]/firstName]`.
- predicates can contain literals and regular expressions, 
    - example: _get all persons where the first name starts with Jane_ would look like `/persons/[firstName=\\/^Jane\\/]`.

#### JPath install

```bash
npm install @mangos/jpath
```

##### USE CASE slice the newsfeed from https://newsapi.org/

There is a snippet of the database (as a JS object) of the most trending messages of the last 10 min 08-JAN-2020 5:47pm from `https://newsapi.org/`.

```json
{
    "articles": [
        {
            "author": "Carmen Reinicke",
            "content": "Reuters\r\nTesla is starting 2020 with a record: It's now the most valuable US automaker ever.\r\nThe Elon Musk-led automaker's recent stock rally pushed its market value to nearly $85 billion at Tuesday's close, surpassing the $80.8 billion set by Ford in 1999. … [+1929 chars]",
            "description": "Tesla is now the highest-valued automaker in US history (TSLA)",
            "publishedAt": "2020-01-08T17:47:31Z",
            "source": {
                "id": "business-insider",
                "name": "Business Insider"
            },
            "title": "Tesla is now the highest-valued automaker in US history (TSLA) - Business Insider",
            "url": "https://markets.businessinsider.com/news/stocks/tesla-stock-price-rally-most-valuable-us-car-maker-history-2020-1-1028804022",
            "urlToImage": "https://images.markets.businessinsider.com/image/5e15feeef4423113aa1e3067-1365/screen-shot-2019-07-18-at-111611-am.png"
        },
        {
            "author": "Carmen Reinicke",
            "content": "Reuters\r\nTesla is starting 2020 with a record: It's now the most valuable US automaker ever.\r\nThe Elon Musk-led automaker's recent stock rally pushed its market value to nearly $85 billion at Tuesday's close, surpassing the $80.8 billion set by Ford in 1999. … [+1929 chars]",
            "description": "Tesla is now the highest-valued automaker in US history (TSLA)",
            "publishedAt": "2020-01-08T17:47:31Z",
            "source": {
                "id": "business-insider",
                "name": "Business Insider"
            },
            "title": "Tesla is now the highest-valued automaker in US history (TSLA) - Business Insider",
            "url": "https://markets.businessinsider.com/news/stocks/tesla-stock-price-rally-most-valuable-us-car-maker-history-2020-1-1028804022",
            "urlToImage": "https://images.markets.businessinsider.com/image/5e15feeef4423113aa1e3067-1365/screen-shot-2019-07-18-at-111611-am.png"
        },
        {
            "author": "",
            "content": "Former Nissan Chairman Carlos Ghosn addresses a news conference Wednesday in Beirut, during which he explained his reasons for dodging trial in Japan. The 65-year-old former auto executive, who is accused of financial misconduc, vowed to clear his name in his… [+4549 chars]",
            "description": "The ex-Nissan boss said he had a choice: \"You're going to die in Japan, or you're going to have to get out.\" It was Ghosn's first public comment since fleeing financial misconduct charges for Beirut.",
            "publishedAt": "2020-01-08T17:53:00Z",
            "source": {
                "id": null,
                "name": "Npr.org"
            },
            "title": "Carlos Ghosn, Ex-Nissan Boss, Defends Escape From Japan: 'I Fled Injustice' - NPR",
            "url": "https://www.npr.org/2020/01/08/794505920/ghosn-defends-his-escape-from-japan-no-way-i-was-going-to-be-treated-fairly",
            "urlToImage": "https://media.npr.org/assets/img/2020/01/08/gettyimages-1192544993_wide-3211608dfaff236226161e40b5a9e03de961a525.jpg?s=1400"
        },
        {
            "author": null,
            "content": "An MRI on the back of Los Angeles Lakers star Anthony Davis came back negative for a serious injury and he will travel with the team on its upcoming road trip.\r\nThe Lakers say that Davis has a gluteus maximus contusion. The Lakers play at Dallas on Friday and… [+1471 chars]",
            "description": "An MRI on Anthony Davis' back after he took a scary fall Tuesday night was negative, and he will travel with the team.",
            "publishedAt": "2020-01-08T16:57:58Z",
            "source": {
                "id": null,
                "name": "Espn.com"
            },
            "title": "MRI negative on Lakers' Anthony Davis after bad fall - ESPN",
            "url": "https://www.espn.com/nba/story/_/id/28446487/mri-negative-lakers-anthony-davis-bad-fall",
            "urlToImage": "https://a4.espncdn.com/combiner/i?img=%2Fphoto%2F2020%2F0108%2Fr649767_1296x729_16%2D9.jpg"
        },
    ]
}
```




#### JValidator, Everything & the kitchen sink, example


## JValidator

An extreemly intuitive `JOI like` (but easier to use) JS validator, with the following advantages:

- Easy to extend collection of build in validators with novice features
  - Ability to cross reference data (think foreign keys) within an object being validated
- Compose validators via chaining "dot" notation aka `V.IfFalsy(123).integer(4).optional`
- adding a validator via chaining to an existing validator creates a new validator instance: `V.float().integer()` is a different validator then `V.float()`.

[Full Api Doc](packages/validator/README.md)

#### JValidator install

```bash
npm install @mangos/jvalidator
```

#### JValidator, Everything & the kitchen sink, example

##### USE CASE

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

#### Modular approach

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



[License MIT](LICENSE);

Thinking about contributing? Read [guidelines](CODE_OF_CONDUCT.md) and [code of conduct](CONTIBUTING_GUIDELINES.md)

[issues]: https://github.com/R-js/mangos/issues

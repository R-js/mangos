const chaiAsPromised = require('chai-as-promised');
const {
    describe,
    it,
    before,
    after
} = require('mocha');
const chai = require('chai');
chai.should();
chai.use(chaiAsPromised);
const {
    expect
} = chai;

const clone = require('clone');

const { objectSlice } = require('../src/jspath/objectSlice');
const {
    getTokens
} = require('../src/jspath/tokenizer');

const {
    from: arr
} = Array;


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

describe('objectSlice', () => {

    describe('slice path in data array', () => {
        it('slice string data "retailOutlets/name"', () => {
            const copy = clone(data);
            const path = getTokens('retailOutlets/name');
            const result = objectSlice(copy, path);
            expect(result).to.deep.equal(['radioshack', 'wallmart']);
        });
        it('slice string data "retailOutlets/address/[state=NJ]"', () => {
            const copy = clone(data);
            const path = getTokens('retailOutlets/address/[state=NJ]');
            const result = objectSlice(copy, path);
            expect(result).to.deep.equal([{
                streetName: 'NJ-23 Riverdale',
                zip: 'NJ 07457',
                houseNr: 48,
                state: 'NJ'
            }]);
        });
        it('slice string data "/customers/deliveryAddress/zip"', () => {
            const copy = clone(data);
            const path = getTokens('/customers/deliveryAddress/zip');
            const result = objectSlice(copy, path);
            expect(result).to.deep.equal(['NY 11236']);
        });
        it('slice string data "/customers/orderItems/[id=\\/111\\/]"', () => {
            const copy = clone(data);
            const path = getTokens('/customers/orderItems/[id=\\/111\\/]');
            const result = objectSlice(copy, path);
            expect(result).to.deep.equal([{
                id: 11184,
                category: 'food',
                item: 'apples',
                shop: 'WalMart'
            }]);
        });
        it('slice string data "/customers/orderItems/[\\/.*\\/=\\/111\\/]"', () => {
            const copy = clone(data);
            const path = getTokens('/customers/orderItems/[\\/.*\\/=\\/111\\/]');
            const result = objectSlice(copy, path);
            expect(result).to.deep.equal([{
                id: 11184,
                category: 'food',
                item: 'apples',
                shop: 'WalMart'
            }]);
        });
        it('dont select anything "/customers/orderItems/[=\\/111\\/]"', () => {
            const copy = clone(data);
            const path = getTokens('/customers/orderItems/[=\\/111\\/]');
            const result = objectSlice(copy, path);
            expect(result).to.deep.equal([]);
        });
        it('not select anything "/customers/orderItems/[nonexistingKey=\\/111\\/]"', () => {
            const copy = clone(data);
            const path = getTokens('/customers/orderItems/[\\/nonexistingKey\\/=\\/111\\/]');
            const result = objectSlice(copy, path);
            expect(result).to.deep.equal([]);
        });
        it('test flatmapping a path that is an actual array "/customers/orderItems"', () => {
            const copy = clone(data);
            const path = getTokens('/customers/orderItems');
            const result = objectSlice(copy, path);
            expect(result).to.deep.equal([{
                    id: 11184,
                    category: 'food',
                    item: 'apples',
                    shop: 'WalMart'
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
                    shop: 'radioshack'
                },
                {
                    id: 11945,
                    category: 'electronics',
                    item: {
                        name: 'electric shaver'
                    },
                    shop: 'radioshack'
                }
            ]);
        });
        it('reject invalid token "/customers/orderItems "', () => {
            const copy = clone(data);
            const path = getTokens('/customers/orderItems');
            path[path.length - 1].token = 0xff;
            const resultfn = () => objectSlice(copy, path);
            expect(resultfn).to.throw('selector is an incorrect token {"token":255,"start":11,"end":20,"value":"orderItems"}');
        });
    });
});
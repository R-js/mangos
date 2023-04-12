const clone = require('clone');

const objectSlice = require('../src/lib/objectSlice');
const {
    pathAbsorber
} = require('../src/lib/tokenizer');

const createIterator = require('../src/lib/createIterator');

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
    customers: [
        {
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
            const path = 'retailOutlets/name';
            const iterator = createIterator(pathAbsorber(path));
            const result = Array.from(objectSlice(copy, iterator));
            expect(result).to.deep.equal(['radioshack', 'wallmart']);
        });
        it('slice string data "retailOutlets/address/[state=NJ]"', () => {
            const copy = clone(data);
            const path = 'retailOutlets/address/[state=NJ]';
            const iterator = createIterator(pathAbsorber(path));
            const result = Array.from(objectSlice(copy, iterator));
            expect(result).to.deep.equal([{
                streetName: 'NJ-23 Riverdale',
                zip: 'NJ 07457',
                houseNr: 48,
                state: 'NJ'
            }]);
        });
        it('slice string data "/customers/deliveryAddress/zip"', () => {
            const copy = clone(data);
            const path = '/customers/deliveryAddress/zip';
            const iterator = createIterator(pathAbsorber(path));
            const result = Array.from(objectSlice(copy, iterator));
            expect(result).to.deep.equal(['NY 11236']);
        });
        it('slice string data "/customers/orderItems/[id=/111/]"', () => {
            const copy = clone(data);
            const path = '/customers/orderItems/[id=/111/]';
            const iterator = createIterator(pathAbsorber(path));
            const result = Array.from(objectSlice(copy, iterator));
            expect(result).to.deep.equal([{
                id: 11184,
                category: 'food',
                item: 'apples',
                shop: 'WalMart'
            }]);
        });
        it('slice string data "/customers/orderItems/[/.*/=/111/]"', () => {
            const copy = clone(data);
            const path = '/customers/orderItems/[/.*/=/111/]';
            const iterator = createIterator(pathAbsorber(path));
            const result = Array.from(objectSlice(copy, iterator));
            expect(result).to.deep.equal([{
                id: 11184,
                category: 'food',
                item: 'apples',
                shop: 'WalMart'
            }]);
        });

        it('not select anything "/customers/orderItems/[nonexistingKey=\\/111\\/]"', () => {
            const copy = clone(data);
            const path = '/customers/orderItems/[/nonexistingKey/=/111/]';
            const iterator = createIterator(pathAbsorber(path));
            const result = Array.from(objectSlice(copy, iterator));
            expect(result).to.deep.equal([]);
        });
        it('test flatmapping a path that is an actual array "/customers/orderItems"', () => {
            const copy = clone(data);
            const path = '/customers/orderItems';
            const iterator = createIterator(pathAbsorber(path));
            const result = Array.from(objectSlice(copy, iterator));
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
            const arr = Array.from(pathAbsorber('/customers/orderItems'));
            arr[arr.length - 1].token = 0xff;
            const iterator = createIterator(arr);
            const genErr = () => Array.from(objectSlice(copy, iterator));
            expect(genErr).to.throw('token is invvalid {"token":255,"start":11,"end":20,"value":"orderItems"}')
        });
        it('the name of the customers with shopping items from wallmart', () => {
            const copy = clone(data);
            copy.customers.push({
                name: 'Mr Jimmy Hoffa',
                deliveryAddress: {
                    zip: 'NE 12012',
                    streetName: 'somehere in the desert',
                    houseNumber: '6 feet under'
                },
                orderItems: [{
                    id: 1256,
                    category: 'clothing',
                    item: 'bullitProof Vest',
                    shop: 'WalMart', // references /retailOutlets/name
                }]
            });
            const iterator = createIterator(pathAbsorber('/customers/orderItems/[shop=radioshack]/../name'));
            const result = Array.from(objectSlice(copy, iterator));
            expect(result).to.deep.equal(['Ms Betty DavenPort',
                'Ms Betty DavenPort',
                'Ms Betty DavenPort']);
            const iterator2 = createIterator(pathAbsorber('/customers/orderItems/[shop=WalMart]/../name'));
            const result2 = Array.from(objectSlice(copy, iterator2));
            expect(result2).to.deep.equal(['Ms Betty DavenPort', 'Mr Jimmy Hoffa']);
        });
        it('reject invalid token "/customers/orderItems "', () => {
            const copy = clone(data);
            const arr = Array.from(pathAbsorber('/customers/orderItems'));
            arr[arr.length - 1].token = 0xff;
            const iterator = createIterator(arr);
            const genErr = () => Array.from(objectSlice(copy, iterator));
            expect(genErr).to.throw('token is invvalid {"token":255,"start":11,"end":20,"value":"orderItems"}')
        });
        it('recursive descent "/**/zip"', () => {
            const copy = clone(data);
            const iterator = createIterator(Array.from(pathAbsorber('/**/zip')));
            const result = Array.from(objectSlice(copy, iterator));
            expect(result).to.deep.equal(['PA 17557', 'NJ 07457', 'NY 11236']);
        });
        it('recursive descent "/**/zip/../"', () => {
            const copy = clone(data);
            const iterator = createIterator(Array.from(pathAbsorber('/**/zip/../')));
            const result = Array.from(objectSlice(copy, iterator));
            expect(result).to.deep.equal([{
                streetName: 'E Main St, New Holland',
                zip: 'PA 17557',
                houseNr: 331
            },
            {
                streetName: 'NJ-23 Riverdale',
                zip: 'NJ 07457',
                houseNr: 48,
                state: 'NJ'
            },
            {
                zip: 'NY 11236',
                streetName: 'Devonshire Dr.Brooklyn',
                houseNumber: 72
            }]);
        });
    });
});
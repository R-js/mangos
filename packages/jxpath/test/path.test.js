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
const jpath = require('../src/index');

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
    ['..']: {
        ['..']: '... not interpolated'
    },
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
const jxa = (path, data) => (data && Array.from(jpath(path, data))) || jpath(path);

describe('path', () => {
    describe('edge cases and errors', () => {
        it('non string path should throw error',()=>{
            const errGen = () => jpath(1234);
            expect(errGen).to.throw('path should be a string');
        });
        it('empty path ""', () => {
            const copy = clone(data);
            const result = jxa('retailOutlets/name', copy);
            expect(result).to.deep.equal(['radioshack', 'wallmart']);
        });
        it('no path should raise an error', () => {
            const copy = clone(data);
            const result = () => jpath('', copy);
            expect(result).to.throw('path cannot be empty or just spaces');
        });
        it('execute curried version "/customers/name" with no data', () => {
            const copy = clone(data);
            const slice = jpath('/customers/name');
            const result = Array.from(slice()); // 
            expect(result).to.deep.equal([]);
        });
        it('ending forward slash should be ignored "/////customers/name', () => {
            const copy = clone(data);
            const slice = jxa('/////customers/name/', data);
            expect(slice).to.deep.equal(['Ms Betty DavenPort']);
        });
    });

    describe('normal operation', () => {
        it('get "/customers/name"', () => {
            const copy = clone(data);
            const result = jxa('/customers/name', copy);
            expect(result).to.deep.equal(['Ms Betty DavenPort']);
        });
        it('execute curried version "/customers/name"', () => {
            const copy = clone(data);
            const slice = jpath('/customers/name');
            const result = Array.from(slice(copy));
            expect(result).to.deep.equal(['Ms Betty DavenPort']);
        });
    });
});
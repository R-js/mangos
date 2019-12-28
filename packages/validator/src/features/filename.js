const {normalize, parse} = require('path');

const { features } = require('./dictionary');

features.set('hasFilename', {
    factory: 0,
    name: 'hasFilename',
    fn: file => {
        if (typeof a !== 'string'){
            return [undefined, `not a string`];
        }
        const normalaized = normalize(file);
        const { root, dir, base, ext, name } = parse(normalaized);
        if (!(ext && name)){ // there is no file
            return [undefined,`"${file}" is does not contain a filename ending [name].[ext] format` ];
        }
        return [normalaized, undefined];
    }
});


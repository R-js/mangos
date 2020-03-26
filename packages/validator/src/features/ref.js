const resolve = require('../jspath/resolve');
const formatPath = require('../jspath/format');

const {
   features
} = require('./dictionary');

const { jxpathUseTokens: jxpath, pathAbsorber, tokens } = require('@mangos/jxpath/internals');

const { equals } = require('../equals');

const predicateMap = {
   array: {
      absent: arrayAbsent,
      exist: arrayExist
   },
   nonarray: {
      absent: valueAbsent,
      exist: valueExist
   }
}

function valueExist(value, target) {
   // all elements from src must exist in target
   const found = target.find(m => equals(value, m));
   if (!found) return [undefined, `element ${JSON.stringify(value)} could not be found`]; // fast exit 
   return [value, undefined];
}

function valueAbsent(value, target) {
   // all elements from src must exist in target
   const found = target.find(m => equals(value, m));
   if (found) return [undefined, `element ${JSON.stringify(value)} was found`]; // fast exit 
   return [value, undefined];
}

function arrayExist(valueItems, target) {
   // all elements from src must exist in target
   for (const value of valueItems) {
      const found = target.find(m => equals(value, m));
      if (!found) return [undefined, `element ${JSON.stringify(value)} could not be found`]; // fast exit 
   }
   return [valueItems, undefined];
}

function arrayAbsent(valueItems, target) {
   // all elements from src must exist in target
   for (const value of valueItems) {
      const found = target.find(m => equals(value, m));
      if (found) return [undefined, `element ${JSON.stringify(value)} was found`];
   }
   return [valueItems, undefined];
}

function createRef(path, ignore) {
   if (typeof path !== 'string' || path.trim().length === 0) {
      throw new TypeError(`path:"${path}" was not a valid for the create ref featur`);
   }

   const to = Array.from(pathAbsorber(path));
   const errors = to.filter(p => p.error).map(m => m.error).join('|');
   if (errors) {
      throw new TypeError(`the path contained errors: ${errors}`);
   }
   
   if (to[0].token !== tokens.SLASH){
      to.unshift({
         value: '..',
         token: tokens.PARENT
      });
   }
   
   return function (predicate) {
      if (predicate !== 'exist' && predicate !== 'absent') {
         throw new TypeError(`the "ref" feature should be finalized with "exist" or "absent"`);
      }
      return function sliceAndValidate(partition, ctx) {
       const selector = resolve(ctx.location, to);
         const iterator = jxpath(selector, ctx.data, ignore);
         const nodelist = Array.from(iterator);
         // depending on the "type" of the partition argument, we should do a number of things 
         // 1. if it is an array?
         //     1.a if predicate === 'exist' all elements of the array need to be accounted for
         //     1.b if predicate === 'absent' none of the elements in the array must be in the nodelist
         // 2. if it is a scalar 
         //     2.a if predicate === 'exist' the value must exist in nodelist
         //     2.b if predicate === 'absent' the value must not exist in nodelist 
         const s1 = Array.isArray(partition) ? 'array' : 'nonarray';
         const fn = predicateMap[s1][predicate];
         const [result, error] = fn(partition, nodelist);
         if (error) {
            return [undefined, `${error} at ${formatPath(selector)}`];
         }
         return [[result], undefined];
      };
   };
}


features.set('ref', {
   factory: 2,
   name: 'ref',
   fn: createRef
});
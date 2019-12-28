/* usage:
/ v.object({
   .
   name: v.ref('/newlyhired/persons/name').exists,
   tasks: v.ref('/tasks/taskNames').absent,
   // other things you can think of
   such as:
      v.ref('/tasks/taskname/[key=value]/some/thing/else')
      v.ref('/tasks/taskname/[=value]/some/thing/else')
      v.ref('/tasks/taskname/[key=/regexp/]/some/thing/else')
      v.ref('/tasks/taskname/[regexp=exgexp]/some/thing/else')
   .
});

*/
// partition data, ctx

const {
   getTokens,
   resolve,
   tokens,
   formatPath
} = require('../jspath/tokenizer');

const {
   features
} = require('./dictionary');

const objectSlice = require('../jspath/objectSlice');
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

function valueExist(value, target){
   // all elements from src must exist in target
   const found = target.find(m => equals(value, m));
   if (!found) return [ undefined, `element ${JSON.stringify(value)} could not be found`]; // fast exit 
   return [value, undefined];
}

function valueAbsent(value, target){
   // all elements from src must exist in target
   const found = target.find(m => equals(value, m));
   if (found) return [ undefined, `element ${JSON.stringify(value)} was found`]; // fast exit 
   return [value, undefined];
}

function arrayExist(valueItems, target){
    // all elements from src must exist in target
    for (const value of valueItems){
       const found = target.find(m => equals(value, m));
       if (!found) return [ undefined, `element ${JSON.stringify(value)} could not be found`]; // fast exit 
    }
    return [valueItems, undefined];
}

function arrayAbsent(valueItems, target){
   // all elements from src must exist in target
   for (const value of valueItems){
      const found = target.find(m => equals(value, m));
      if (found) return [undefined, `element ${JSON.stringify(value)} was found`]; 
   }
   return [valueItems, undefined];
}


function createRef(path) {
   //  lex the path and validate (needs to be somehting usefull),
   const to = getTokens(path); // could throw 
   if (to.length === 0) {
      throw new TypeError(`path:"${path}" was not a valid for the create ref featur`);
   }
   if (to[0].token !== tokens.SLASH) { // relative
      to.unshift({
         token: tokens.SLASH,
         value: '..'
      });
      to.unshift({
         token: tokens.PARENT,
         value: '..'
      });
   }
   // preducate
   // - exists // the singular value (any type, object, array, scalar) should match something in the nodelist  (use deepequal in this case)
   // - absent // the negation of exists
   // - later to be extended
   return function (predicate) {
      if (predicate !== 'exist' && predicate !== 'absent') {
         throw new TypeError(`the "ref" feature should be finalized with "exist" or "absent"`);
      }
      return function sliceAndValidate(partition, ctx) {
         const selector = resolve(ctx.location, to);
         const nodelist = objectSlice(ctx.data, selector);
         // depending on the "type" of the partition argument, we should do a number of things 
         // 1. if it is an array?
         //     1.a if predicate === 'exist' all elements of the array need to be accounted for
         //     1.b if predicate === 'absent' none of the elements in the array must be in the nodelist
         // 2. if it is a scalar 
         //     2.a if predicate === 'exist' the value must exist in nodelist
         //     2.b if predicate === 'absent' the value must not exist in nodelist 
         const s1 = Array.isArray(partition) ? 'array':'nonarray';
         const fn = predicateMap[s1][predicate];
         const  [result, error] = fn(partition, nodelist);
         if (error){
            return [result, `${error} at ${formatPath(selector)}`];
         }
         return [result, undefined];
      };
   };
}


features.set('ref', {
   factory: 2,
   name: 'ref',
   fn: createRef
});
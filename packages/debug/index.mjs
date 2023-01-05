import { setConfig, getConfig, debug } from './dist/esm/index.mjs';

const printer = debug('worker1234');

setConfig({ namespaces: null });
printer('you will not see this line');

setConfig({ namespaces: 'worker*' });
printer('you will see this line');

console.log(getConfig());
//await new Promise(resolve => setTimeout(resolve, 500));

const fp = require('.')

for (const path of fp.inferPathType('/unix/maybe')){
    console.log(path);
}

const { inferPathType, lexPath, resolve } = require('./lib/parser');

module.exports = {
    inferPathType,
    lexPath,
    resolve,
    $tokens: {
        root: {
            POSIX_ROOT: '\x02', // done
            TDP_ROOT: '\x03', // traditional dos path
            UNC_ROOT: '\x04', // unc root
            DDP_ROOT: '\x05' // dos device path root
        },
        SEP: '\x01', // done
        PATHELT: '\x06',
        PARENT: '\x07',
        CURRENT: '\x08'
    }
};

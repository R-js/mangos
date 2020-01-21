'use strict';

const tokens = {
    SEP: '\x01', // done
    ROOT_POSIX: '\0x02', // done
    LOCAL_FS_ROOT: '\0x03', //done windows like c:\\
    ROOT_LONG_UNC: '\0x05', // done
    ROOT_DEVICE: '\0x06', //         dir "//./x:"  (works,  from cmd and powershell)
    ROOT_SHORT_UNC: '\0x07', //done
    CURRENT: '\0x08', 
    PARENT: '\0x09', 
    PATHPART: '\0x0a', //
};

function lookAheadUntill(str, fn, start, length = str.length - start) {
    let i = start;
    for (; i < str.length; i++) {
        if (i >= (start + length)) {
            break;
        }
        if (!fn(str[i])) {
            break;
        }
    }
    i--;
    // so i is at the place where conditions have failed
    return ({
        end: i,
        start,
        length: i - start + 1
    });
}

function validSep(s) {
    return s === '\\' || s === '/';
}

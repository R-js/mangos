const {normalize, parse} = require('path');

const { features } = require('./dictionary');

features.set('hasPath', {
    factory: 0,
    name: 'hasPath',
    fn: file => {
        if (typeof a !== 'string'){
            return [undefined, `not a string`];
        }
        const normalized = normalize(file);
        const { root, dir, base, ext, name } = parse(normalized);
        if (!(root && dir)){ // there is no file
            return [undefined,`"${file}" is does not contain a filename ending [name].[ext] format` ];
        }
        return [normalaized, undefined];
    }
});

require(path).posix.normalize

/* windows: https://docs.microsoft.com/en-us/windows/win32/fileio/naming-a-file?redirectedfrom=MSDN#namespaces

Because it turns off automatic expansion of the path string,
 the "\\?\" prefix also allows the use of ".." and "." in the path names, 
 which can be useful if you are attempting to perform operations 
 on a file with these otherwise reserved relative path specifiers as part of the fully qualified path.

 Many but not all file I/O APIs support "\\?\"; you should look at the reference topic for each API to be sure.

 dont interpolate .. and . 

Device namespace

"\\.\CdRomX". 
"\\.\COM96"   comm port COM96

"c:\\(multiple \)""   /(multiple collapse) or \(multiple)  

or (\\.\devicename\ (multiple \\)
///.///.////

'c:zzeaze'  is not a root name

/*
 /somename    : root + subdir
 /somename.js : file on root
 /somename/   : root + subdir
 /somename.js/: root + subdir
 somename/somename2.js :  dir + file
 /somename/somename2.js/: dir + dir, no file

 c:\\\\  : root

 \\.\device  : device

/: root

c:zzd/subdir/filename   : non root subdir

gives back: . isabsolute,  (starts with .. or .?)

also absorbs ../../x/../../y to '..\\..\\..\\y' 

by default, normalize posix, 
specify win32 flag explicitly as an argument otherwise, normalize '\\'

another example 
> path.normalize('/././../x/../../y')
'\\y

*/

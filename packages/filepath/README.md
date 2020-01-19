## Rollup.js path resolution

outputOptions.dir = undefined => from options
outputOptions.file = dist2/bundlexyz.js => from options
outputFile.fileName = bundlexyz.js ==> from bundle entry

Algo resolution for asset and chunk files
const fileName = path.resolve(outputOptions.dir || path.dirname(outputOptions.file), outputFile.fileName);
 
note: path.dirname('dist2/bundlexyz.js') => 'dist2'

path.resolve uses current working dir of the process, where it is started, so we can now infer actual working dir using this algo


## MS Windows path system

https://docs.microsoft.com/en-us/dotnet/standard/io/file-path-formats#traditional-dos-paths

traditional dos path

c:\xxx\yyy\file.txt


\Program Files\..\   absolute path from root current drive

2008\january.xls  from current working directory



..\Publications\TravelBrochure.pdf from current directory

C:Projects\apilibrary\apilibrary.sln , works from currend directory from drive c

^^  dont allow this!! just dont

## UNC Path

\\.

\\system07\c$\  the root of the C: on drive system07
\\Server2\Share\Test\Foo.txt    volume is \\Server2\Share

## DOS

\\.\C:\Test\Foo.txt  fs.readdirSync('//./C:/')  
\\?\C:\Test\Foo.txt

fs.readdirSync('//./C:/') works!
fs.readdirSync('//./C:') does not work

forbid this
\\.\Volume{someid}\test\foo.txt
\\.\Volume{b75e2c83-0000-0000-0000-602f00000000}\Test\Foo.txt  

fs.readdirSync('//?/UNC/Desktop-j8f8v02/c')  this works
fs.readdirSync('//?/UNC/Desktop-j8f8v02/c:/')  this NOT works
fs.readdirSync('//?/UNC/Desktop-j8f8v02/c$/')  this works

## Canonicalizing separators

All forward slashes (/) are converted into the standard Windows separator, the back slash (\)

## Evaluating relative components

For a double period, the current segment and the parent segment are removed, since the double period refers to the parent directory.

Parent directories are only removed if they aren't past the root of the path. The root of the path depends on the type of path. It is the drive (C:\) for DOS paths, the server/share for UNCs (\\Server\Share), and the device path prefix for device paths (\\?\ or \\.\).

# normalisation

Normally, any path passed to a Windows API is (effectively) passed to the GetFullPathName function and normalized. There is one important exception: a device path that begins with a question mark instead of a period. Unless the path starts exactly with \\?\ (note the use of the canonical backslash), it is normalized.
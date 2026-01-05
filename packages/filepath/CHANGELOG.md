# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## version "1.0.8" 2026-jan-5
   ### changed
   - `PathTokenEnum` export is revoked (Jacob Bogers <jkfbogers@gmail.com>)
   - `Token` class has members to differentiate token type (see readMe.md) (Jacob Bogers <jkfbogers@gmail.com>)
   ### fixed
   - `Token` was exported as a type but not a class (Jacob Bogers <jkfbogers@gmail.com>)

## version "1.0.7" 2026-jan-2
   ### changed
   - exported the enum `PathTokenEnum` (Jacob Bogers <jkfbogers@gmail.com>)

## version "1.0.6" 2025-dec-22
   ### fixed
   - forgot to export `resolvePathObject` (Jacob Bogers <jkfbogers@gmail.com>)

## version "1.0.5" 2025-dec-21
   ### changed
   - rename Token to FileToken (Jacob Bogers <jkfbogers@gmail.com>)
   - export ParsedPath and ParsedPathError (Jacob Bogers <jkfbogers@gmail.com>)
   - functions "resolve" and "resolveObject" do not return ParsedPathError, instead they throw an error (Jacob Bogers <jkfbogers@gmail.com>)

## version "1.0.3" 2025-dec-16
   ### changed
   - corrections to README.md document.

## version "1.0.2" 2025-dec-16
   ### changed
   - corrections to README.md document.

## version "1.0.1" 2025-dec-16
   ### changed
   - corrections to README.md document.

## version "1.0.0" 2025-dec-16
   ### added
   - total rebuild in typescript, vite, vitest, node24, biome  (Jacob Bogers <jkfbogers@gmail.com>)
   ### removed 
   - chai, mocha, (Jacob Bogers <jkfbogers@gmail.com>)


## "0.0.8"
  ### fixes
    - corrected a link in package/filepath/readme.md


## "0.0.7"

 ### fixes
 - corrected homepage property in package.json, points now to valid readme of the package "filelist" in the mono-repo "mangos".

## "0.0.6"
 ### changes
 - The functions `inferPathType` and `lexPath` return the same Pathobject.
   - `inferPathType` returns an iterator of PathObject
   - `lextPath` returns a singular PathObject 
 - README adjusted

## "0.0.5"

use globalThis and optional chainging to make platform detection agnostic in node and browser (globalhis.navigator.platform)

## "0.0.4"

Initial release

Added eslint for typechecking
Zero dependency package
internals adjusted for use in  @mangos/validator package


## 1.0.10

Released 13 Mar 2020
Mitiate Circular references by adding an "ignore" argument to the jxpath
Updated documentation to documentation

## 1.0.5

Released Feb 7 2020
Added "internal" sub-module

## 1.0.4

Released Feb 7 2020
- Fixed trailing '/' should not cause a exception

## 0.0.2

Released Jan 15, 2020
 - Development and testing done

## 0.0.1

Released dec 28, 2019
 - initial release
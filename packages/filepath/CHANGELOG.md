# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## version "1.0.0" 2025-dec-13
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
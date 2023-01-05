#!/usr/bin/env node
// @ts-check

import {
  readdirSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
} from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, relative, dirname, extname, resolve } from 'node:path';
import ts from 'typescript';
import { parse } from 'acorn';
import jxpath from '@mangos/jxpath';
import { generate } from 'escodegen';

const DIR = './dist';
const DIR_COMMONJS = './dist/commonjs';
const DIR_ESM = './dist/esm';

// Delete and recreate the output directory.
try {
  rmdirSync(DIR, { recursive: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
mkdirSync(DIR_COMMONJS, { recursive: true });
mkdirSync(DIR_ESM, { recursive: true });
// Read the TypeScript config file.
const { config } = ts.readConfigFile('tsconfig.json', (fileName) =>
  readFileSync(fileName).toString(),
);

const sourceDir = join('src');
const sourceFile = join('src', 'index.ts');

// Build CommonJS module.
compile([sourceFile], DIR_COMMONJS, {
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  declaration: false,
  sourceMap: false,
});

// Build an ES2015 module and type declarations.

compile([sourceFile], DIR_ESM, {
  module: ts.ModuleKind.ES2020,
  declaration: true,
  declarationDir: './types', // this becomes ./dist/types
  sourceMap: false,
});

/**
 * Compiles files to JavaScript.
 *
 * @param {string[]} files
 * @param {ts.CompilerOptions} options
 */
function compile(files, targetDIR, options) {
  const compilerOptions = { ...config.compilerOptions, ...options };
  const host = ts.createCompilerHost(compilerOptions);

  host.writeFile = (fileName, contents) => {
    const isDts = fileName.endsWith('.d.ts');

    const relativeToSourceDir = relative(sourceDir, fileName);
    const subDir = join(targetDIR, dirname(relativeToSourceDir));

    mkdirSync(subDir, { recursive: true });
    let path = join(targetDIR, relativeToSourceDir);

    if (!isDts) {
      const astTree = parse(contents, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ranges: true,
        locations: false,
      });

      switch (compilerOptions.module) {
        case ts.ModuleKind.CommonJS: {
          const selectedNodes = jxpath(
            '/**/[type=CallExpression]/callee/[type=Identifier]/[name=require]/../arguments/[type=Literal]/',
            astTree,
          );
          // loop over all .js and change then

          for (const node of selectedNodes) {
            node.value = resolveToFullPath(fileName, node.value, '.cjs');
          }
          contents = generate(astTree);
          path =
            extname(path) === ''
              ? path + '.cjs'
              : path.slice(0, -extname(path).length) + '.cjs';
          break;
        }
        case ts.ModuleKind.ES2020: {
          const selectedNodes = jxpath(
            '/**/[type=ImportDeclaration]/source/',
            astTree,
          );
          for (const node of selectedNodes) {
            node.value = resolveToFullPath(fileName, node.value, '.mjs');
          }
          contents = generate(astTree);
          // Use the .mjs file extension.
          path =
            extname(path) === ''
              ? path + '.mjs'
              : path.slice(0, -extname(path).length) + '.mjs';
          break;
        }
        default:
          throw Error('Unhandled module type');
      }
    }

    // writeFile from "fs/promises"
    writeFile(path, contents)
      .then(() => {
        // eslint-disable-next-line no-console
        console.log('Built', path);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
      });
  }; // host.writeFile function definition end

  const program = ts.createProgram(files, compilerOptions, host);

  program.emit();
}

// note: this is *.ts source code so...
function resolveToFullPath(module, importStatement, forceExt) {
  if (!importStatement.startsWith('./') && !importStatement.startsWith('../')) {
    // dont change, this is a npm module import
    return importStatement;
  }
  // possible physical location of a file
  const candidate = resolve(dirname(module), importStatement);
  // is it a dir ?
  let lstat = {
    isDirectory() {
      return false;
    },
  };
  try {
    lstat = lstatSync(candidate);
  } catch (err) {
    // nothing
  }

  if (lstat.isDirectory()) {
    // try index import
    const dirEntries = readdirSync(candidate);
    let indexFileExists = '';
    for (const dirEntry of dirEntries) {
      if (dirEntry === 'index.ts') {
        indexFileExists = dirEntry;
        break;
      }
    }
    if (!indexFileExists) {
      throw new Error(`file does not exist: ${join(candidate, 'index.ts')}`);
    }
    return importStatement + '/index' + forceExt;
  }
  // strip optionally the extension
  const ext = extname(candidate);
  const fileNameWithTSExt =
    (ext === '' ? candidate : candidate.slice(0, -ext.length)) + '.ts';
  lstat = lstatSync(fileNameWithTSExt);
  if (!lstat.isFile()) {
    throw new Error(`file does not exist: ${fileNameWithTSExt}`);
  }
  // must return without extension
  return (
    (ext === '' ? importStatement : importStatement.slice(0, -ext.length)) +
    forceExt
  );
}

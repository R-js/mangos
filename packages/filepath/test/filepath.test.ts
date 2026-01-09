import { resolve as nodeResolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ddpAbsorber } from '../src/absorbers/ddp.js';
import posixAbsorber from '../src/absorbers/posix.js';
import tdpAbsorber from '../src/absorbers/tdp.js';
import uncAbsorber from '../src/absorbers/unc.js';
import { ParsedPath } from '../src/ParsedPath.js';
import { ParsedPathError } from '../src/ParsedPathError.js';
import { PathTokenImpl } from '../src/PathTokenImpl.js';
import { allPath, resolve } from '../src/parser.js';

describe('filepath', () => {
	describe.concurrent('resolve', () => {
		it('test end and start props when resolving from "//?/UNC/Server/share/", to "../../hello/world"', () => {
			const answer = resolve('//?/UNC/Server/share/', '../../hello/world');
			const renderPath = answer.path.map((m) => m.value).join('');
			const fidelity = answer.path.map((m) => renderPath.slice(m.start, m.end + 1)).join('');
			expect(fidelity).toBe('\\\\?\\UNC\\Server\\share\\hello\\world');
			expect(answer.type).toBe('devicePath');
			expect(answer.path.map((pt) => pt.toDTO())).toEqual([
				{
					type: 'ROOT',
					value: '\\\\?\\UNC\\Server\\share',
					start: 0,
					end: 19,
				},
				{ type: 'SEP', start: 20, end: 20, value: '\\' },
				{ type: 'PATHELT', start: 21, end: 31, value: 'hello' },
				{ type: 'SEP', start: 32, end: 32, value: '\\' },
				{ type: 'PATHELT', start: 33, end: 49, value: 'world' },
			]);
		});
		it('from "", to ""', () => {
			const answer = resolve();
			const cwd = nodeResolve();
			const renderPath = answer.path.map((m) => m.value).join('');
			const fidelity = answer.path.map((m) => renderPath.slice(m.start, m.end + 1)).join('');
			expect(fidelity.toLowerCase()).to.equal(cwd.toLowerCase()); // in case of dos , driveletters, unc, devicePath can have UpperCase
		});
		it('from $current working dir', () => {
			const thereCWD = allPath(process.cwd());
			const sameAsCWD = resolve();
			expect(thereCWD).toEqual([sameAsCWD]);
			const fileInCWD = resolve('./h1', 'h2/h9/', 'h3');
			const fidelity1 = fileInCWD.path.map((m) => m.value).join('');
			expect(fidelity1.toLowerCase()).to.equal(
				process.cwd().toLowerCase() + sep + ['h1', 'h2', 'h9', 'h3'].join(sep),
			);
			expect(
				sameAsCWD.path
					.map((m) => m.value)
					.join('')
					.toLowerCase(),
			).toBe(process.cwd().toLowerCase());
		});
		it('from "//?/UNC/Server/share/", to "../../../../../hello/world"', () => {
			const answer = resolve('//?/UNC/Server/share/', '../../../../../hello/world');
			// since the answer is the current working directory we test with "fidelity" heuristic
			// const renderPath = answer.path.map(m => m.value).join('');
			expect(answer.type).toBe('devicePath');
			expect(answer.path.map((pt) => pt.toDTO())).toEqual([
				{
					type: 'ROOT',
					value: '\\\\?\\UNC\\Server\\share',
					start: 0,
					end: 19,
				},
				{ type: 'SEP', start: 20, end: 20, value: '\\' },
				{ type: 'PATHELT', start: 21, end: 40, value: 'hello' },
				{ type: 'SEP', start: 41, end: 41, value: '\\' },
				{ type: 'PATHELT', start: 42, end: 67, value: 'world' },
			]);
		});
		it('from "//Server1/Share1/test1/", to "../../../../../hello/world"', () => {
			const answer = resolve('//Server1/Share1/test1', '../../../../../hello/world');
			expect(answer.type).toBe('unc');
			expect(answer.path.map((tp) => tp.toDTO())).toEqual([
				{
					type: 'ROOT',
					value: '\\\\Server1\\Share1',
					start: 0,
					end: 15,
				},
				{ type: 'SEP', start: 16, end: 16, value: '\\' },
				{ type: 'PATHELT', start: 17, end: 36, value: 'hello' },
				{ type: 'SEP', start: 37, end: 37, value: '\\' },
				{ type: 'PATHELT', start: 38, end: 63, value: 'world' },
			]);
		});

		it('from "C://Server1/Share1/test1/", to "../../../../../hello/world"', () => {
			const answer = resolve('C://Server1/Share1/test1/', '../../../../../hello/world');
			// since the answer is the current working directory we test with "fidelity" heuristic
			//const renderPath = answer.path.map(m => m.value).join('');
			expect(answer.type).toBe('dos');
			expect(answer.path.map((pt) => pt.toDTO())).toEqual([
				{ type: 'ROOT', value: 'c:', start: 0, end: 1 },
				{ type: 'SEP', start: 2, end: 2, value: '\\' },
				{ type: 'PATHELT', start: 3, end: 22, value: 'hello' },
				{ type: 'SEP', start: 23, end: 23, value: '\\' },
				{ type: 'PATHELT', start: 24, end: 49, value: 'world' },
			]);
		});
		it('from "//./Volume{b75e2c83-0000-0000-0000-602f00000000}/ Test/Foo.txt", to "../../../../../hello/world"', () => {
			const answer = resolve(
				'//./Volume{b75e2c83-0000-0000-0000-602f00000000}/Test/Foo.txt',
				'../../.././././///hello/world',
			);
			expect(answer.type).toBe('devicePath');
			expect(answer.path.map((tp) => tp.toDTO())).toEqual([
				{
					type: 'ROOT',
					value: '\\\\?\\Volume{b75e2c83-0000-0000-0000-602f00000000}',
					start: 0,
					end: 47,
				},
				{ type: 'SEP', start: 48, end: 48, value: '\\' },
				{ type: 'PATHELT', start: 49, end: 71, value: 'hello' },
				{ type: 'SEP', start: 72, end: 72, value: '\\' },
				{ type: 'PATHELT', start: 73, end: 101, value: 'world' },
			]);
		});
		it('from "//./Volume{b75e2c83-0000-0000-0000-602f00000000}/ Test/Foo.txt", to "../../../../../hello/world", "c:\\Users\\guest"', () => {
			const answer = resolve(
				'//./Volume{b75e2c83-0000-0000-0000-602f00000000}/Test/Foo.txt',
				'../../.././././///hello/world',
				'c:\\Users\\guest',
			);
			expect(answer.type).toBe('dos');
			expect(answer.path.map((tp) => tp.toDTO())).toEqual([
				{ type: 'ROOT', value: 'c:', start: 0, end: 1 },
				{ type: 'SEP', start: 2, end: 2, value: '\\' },
				{ type: 'PATHELT', start: 3, end: 7, value: 'Users' },
				{ type: 'SEP', start: 8, end: 8, value: '\\' },
				{ type: 'PATHELT', start: 9, end: 13, value: 'guest' },
			]);
		});
	});
	describe('inferPathType', () => {
		it('path "C:\\somedir\\someOtherdir?:\\"', () => {
			const answer = allPath('C:\\somedir\\someOtherdir?:\\');
			expect(answer.map((dp) => dp.type)).toEqual(['dos']);
			expect(answer.map((dp) => dp.path.map((tk) => tk.toDTO()))).toEqual([
				[
					{ type: 'ROOT', value: 'c:', start: 0, end: 1 },
					{ type: 'SEP', start: 2, end: 2, value: '\\' },
					{ type: 'PATHELT', start: 3, end: 9, value: 'somedir' },
					{ type: 'SEP', start: 10, end: 10, value: '\\' },
					{
						type: 'PATHELT',
						start: 11,
						end: 24,
						value: 'someOtherdir?:',
						error: 'name "someOtherdir?:" contains invalid characters',
					},
					{ type: 'SEP', start: 25, end: 25, value: '\\' },
				],
			]);
		});
		it('path "//?/UNC/Server/share"', () => {
			const answer = allPath('//?/UNC/Server/share');
			expect(answer).toEqual([
				new ParsedPath({
					type: 'devicePath',
					path: [
						PathTokenImpl.from({
							type: 'ROOT',
							value: '\\\\?\\UNC\\Server\\share',
							start: 0,
							end: 19,
						}),
					],
				}),
				new ParsedPathError({
					type: 'dos',
					path: [
						PathTokenImpl.from({
							type: 'SEP',
							start: 0,
							end: 1,
							value: '\\',
						}),
						PathTokenImpl.from({
							type: 'PATHELT',
							start: 2,
							end: 2,
							value: '?',
							error: 'name "?" contains invalid characters',
						}),
						PathTokenImpl.from({
							type: 'SEP',
							start: 3,
							end: 3,
							value: '\\',
						}),
						PathTokenImpl.from({
							type: 'PATHELT',
							start: 4,
							end: 6,
							value: 'UNC',
						}),
						PathTokenImpl.from({
							type: 'SEP',
							start: 7,
							end: 7,
							value: '\\',
						}),
						PathTokenImpl.from({
							type: 'PATHELT',
							start: 8,
							end: 13,
							value: 'Server',
						}),
						PathTokenImpl.from({
							type: 'SEP',
							start: 14,
							end: 14,
							value: '\\',
						}),
						PathTokenImpl.from({
							type: 'PATHELT',
							start: 15,
							end: 19,
							value: 'share',
						}),
					],
				}),
			]);
		});

		it('path "c:\\Users\\" interpreted as dos and unix types', () => {
			const answer = allPath('c:\\Users\\', { posix: true, dos: true });

			expect(answer.map((a) => a.toDTO())).toEqual([
				{
					type: 'dos',
					path: [
						{
							type: 'ROOT',
							value: 'c:',
							start: 0,
							end: 1,
						},
						{
							type: 'SEP',
							start: 2,
							end: 2,
							value: '\\',
						},
						{
							type: 'PATHELT',
							start: 3,
							end: 7,
							value: 'Users',
						},
						{
							type: 'SEP',
							start: 8,
							end: 8,
							value: '\\',
						},
					],
				},
				{
					/* 
						perfectly legal in postscript
						
						root@edge-1:~# echo 'hello' > 'c:\\rooot\\'
						root@edge-1:~# ls
							'c:\\rooot\\'   testfolder
					*/
					type: 'posix',
					path: [
						{
							end: 8,
							start: 0,
							type: 'PATHELT',
							value: 'c:\\Users\\',
						},
					],
				},
			]);
		});
		it('path "\\\\Users\\" as "dos"', () => {
			const answer = allPath('\\\\Users\\', { dos: true });
			expect(answer.map((a) => a.toDTO())).toEqual([
				{
					type: 'dos',
					path: [
						{ type: 'ROOT', value: 'c:', start: 0, end: 1 },
						{ type: 'SEP', start: 2, end: 2, value: '\\' },
						{ type: 'PATHELT', start: 3, end: 7, value: 'Users' },
						{ type: 'SEP', start: 8, end: 8, value: '\\' },
					],
				},
			]);
		});
		it('interpret path "/path1/path2" as a "dos"', () => {
			const answer = allPath('/path1/path2', { dos: true });
			expect(answer.map((a) => a.toDTO())).toEqual([
				{
					type: 'dos',
					path: [
						{ type: 'ROOT', value: 'c:', start: 0, end: 1 },
						{ type: 'SEP', start: 2, end: 2, value: '\\' },
						{ type: 'PATHELT', start: 3, end: 7, value: 'path1' },
						{ type: 'SEP', start: 8, end: 8, value: '\\' },
						{ type: 'PATHELT', start: 9, end: 13, value: 'path2' },
					],
				},
			]);
		});
		it('path "\\Users\\share\\" should be "unc"', () => {
			const answer = allPath('\\\\Users\\share\\');
			expect(answer.map((a) => a.toDTO())).toEqual([
				{
					type: 'unc',
					path: [
						{ type: 'ROOT', value: '\\\\Users\\share', start: 0, end: 12 },
						{ type: 'SEP', start: 13, end: 13, value: '\\' },
					],
				},
			]);
		});
	});
	describe('posixAbsorber', () => {
		it('empty path ""', () => {
			const answer = Array.from(posixAbsorber(''));
			expect([]).toEqual(answer);
		});
		it('path "/"', () => {
			const answer = Array.from(posixAbsorber('/'));
			expect(answer.map((a) => a.toDTO())).toEqual([
				{
					type: 'ROOT',
					start: 0,
					end: 0,
					value: '/',
				},
			]);
		});
		it('path "////////"', () => {
			const answer = Array.from(posixAbsorber('////////'));
			expect(answer.map((a) => a.toDTO())).toEqual([
				{
					type: 'ROOT',
					start: 0,
					end: 7,
					value: '////////',
				},
			]);
		});
		it('path "something////////something else"', () => {
			const answer = Array.from(posixAbsorber('something////////something else'));
			expect(answer.map((a) => a.toDTO())).toEqual([
				{
					type: 'PATHELT',
					start: 0,
					end: 8,
					value: 'something',
				},
				{
					type: 'SEP',
					start: 9,
					end: 16,
					value: '////////',
				},
				{
					type: 'PATHELT',
					start: 17,
					end: 30,
					value: 'something else',
				},
			]);
		});
		it('path ".././////../.....///\\\\c:/"', () => {
			const answer = Array.from(posixAbsorber('.././////../.....///\\\\c:/'));
			expect(answer.map((a) => a.toDTO())).toEqual([
				{
					type: 'PARENT',
					start: 0,
					end: 1,
					value: '..',
				},
				{
					type: 'SEP',
					start: 2,
					end: 2,
					value: '/',
				},
				{
					type: 'CURRENT',
					start: 3,
					end: 3,
					value: '.',
				},
				{
					type: 'SEP',
					start: 4,
					end: 8,
					value: '/////',
				},
				{
					type: 'PARENT',
					start: 9,
					end: 10,
					value: '..',
				},
				{
					type: 'SEP',
					start: 11,
					end: 11,
					value: '/',
				},
				{
					type: 'PATHELT',
					start: 12,
					end: 16,
					value: '.....',
				},
				{
					type: 'SEP',
					start: 17,
					end: 19,
					value: '///',
				},
				{
					type: 'PATHELT',
					start: 20,
					end: 23,
					value: '\\\\c:',
				},
				{
					type: 'SEP',
					start: 24,
					end: 24,
					value: '/',
				},
			]);
		});
		it('path "//?/UNC/Server1/share1/file.txt" is legal posix', () => {
			const answer = Array.from(posixAbsorber('//?/UNC/Server1/share1/file.txt'));
			expect(answer.map((a) => a.toDTO())).toEqual([
				{
					type: 'ROOT',
					start: 0,
					end: 1,
					value: '//',
				},
				{
					type: 'PATHELT',
					start: 2,
					end: 2,
					value: '?',
				},
				{
					type: 'SEP',
					start: 3,
					end: 3,
					value: '/',
				},
				{
					type: 'PATHELT',
					start: 4,
					end: 6,
					value: 'UNC',
				},
				{
					type: 'SEP',
					start: 7,
					end: 7,
					value: '/',
				},
				{
					type: 'PATHELT',
					start: 8,
					end: 14,
					value: 'Server1',
				},
				{
					type: 'SEP',
					start: 15,
					end: 15,
					value: '/',
				},
				{
					type: 'PATHELT',
					start: 16,
					end: 21,
					value: 'share1',
				},
				{
					type: 'SEP',
					start: 22,
					end: 22,
					value: '/',
				},
				{
					type: 'PATHELT',
					start: 23,
					end: 30,
					value: 'file.txt',
				},
			]);
		});
	});
	describe.skip('uncAbsorber', () => {
		it('empty path ""', () => {
			const answer = Array.from(uncAbsorber(''));
			expect(answer).toEqual([]);
		});
		it('empty path "//server/share/"', () => {
			const answer = Array.from(uncAbsorber('//server/share/'));
			expect(answer.map((a) => a.toDTO())).toEqual([
				{
					type: 'ROOT',
					value: '\\\\server\\share',
					start: 0,
					end: 13,
				},
				{
					end: 14,
					start: 14,
					type: 'SEP',
					value: '\\',
				},
			]);
		});
		it('empty path "//server/share////hello\\world"', () => {
			const answer = Array.from(uncAbsorber('//server/share////hello\\world'));
			expect(answer.map((a) => a.toDTO())).toEqual([
				{
					type: 'ROOT',
					value: '\\\\server\\share',
					start: 0,
					end: 13,
				},
				{
					type: 'SEP',
					start: 14,
					end: 17,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 18,
					end: 22,
					value: 'hello',
				},
				{
					type: 'SEP',
					start: 23,
					end: 23,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 24,
					end: 28,
					value: 'world',
				},
			]);
		});
	});
	describe.skip('tdp (traditional dos path) Absorber', () => {
		it('path "c:', () => {
			const answer = Array.from(tdpAbsorber('c:'));
			expect(answer).toEqual([
				{
					type: 'ROOT',
					value: 'c:',
					start: 0,
					end: 1,
				},
			]);
		});
		it('path "c://', () => {
			const answer = Array.from(tdpAbsorber('c://'));
			expect(answer).toEqual([
				{
					type: 'ROOT',
					value: 'c:',
					start: 0,
					end: 1,
				},
				{
					type: 'SEP',
					start: 2,
					end: 3,
					value: '\\',
				},
			]);
		});
		it('path "c:\\', () => {
			const answer = Array.from(tdpAbsorber('c:\\'));
			expect(answer).toEqual([
				{
					type: 'ROOT',
					value: 'c:',
					start: 0,
					end: 1,
				},
				{
					type: 'SEP',
					start: 2,
					end: 2,
					value: '\\',
				},
			]);
		});
		it('path "somepathelement', () => {
			const answer = Array.from(tdpAbsorber('somepathelement'));
			expect(answer).toEqual([
				{
					type: 'PATHELT',
					start: 0,
					end: 14,
					value: 'somepathelement',
				},
			]);
		});
		it('path "c:somepath\\anothersub\\/file.txt"', () => {
			const answer = Array.from(tdpAbsorber('c:somepath\\anothersub\\/file.txt"'));
			expect(answer).toEqual([
				{
					type: 'ROOT',
					value: 'c:',
					start: 0,
					end: 1,
				},
				{
					type: 'PATHELT',
					start: 2,
					end: 9,
					value: 'somepath',
				},
				{
					type: 'SEP',
					start: 10,
					end: 10,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 11,
					end: 20,
					value: 'anothersub',
				},
				{
					type: 'SEP',
					start: 21,
					end: 22,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 23,
					end: 31,
					value: 'file.txt"',
					error: 'name "file.txt"" contains invalid characters',
				},
			]);
		});
		it('path contains legacy device names "c:\\someotherCON.txt\\/file.tx"', () => {
			const answer = Array.from(tdpAbsorber('c:\\someotherCON.txt\\/file.txt'));
			expect(answer).toEqual([
				{
					type: 'ROOT',
					value: 'c:',
					start: 0,
					end: 1,
				},
				{
					type: 'SEP',
					start: 2,
					end: 2,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 3,
					end: 18,
					value: 'someotherCON.txt',
					error: 'contains forbidden DOS legacy device name: CON',
				},
				{
					type: 'SEP',
					start: 19,
					end: 20,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 21,
					end: 28,
					value: 'file.txt',
				},
			]);
		});
		it('path contains legacy device names "..\\.\\...\\file.txt"', () => {
			const answer = Array.from(tdpAbsorber('..\\.\\...\\file.txt'));
			expect(answer).toEqual([
				{
					type: 'PARENT',
					start: 0,
					end: 1,
					value: '..',
				},
				{
					type: 'SEP',
					start: 2,
					end: 2,
					value: '\\',
				},
				{
					type: 'CURRENT',
					start: 3,
					end: 3,
					value: '.',
				},
				{
					type: 'SEP',
					start: 4,
					end: 4,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 5,
					end: 7,
					value: '...',
				},
				{
					type: 'SEP',
					start: 8,
					end: 8,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 9,
					end: 16,
					value: 'file.txt',
				},
			]);
		});
		it('path contains invalid chars "..\\.\\?!{..\\file.txt"', () => {
			const answer = Array.from(tdpAbsorber('..\\.\\?!{..\\file.txt'));
			expect(answer).toEqual([
				{
					type: 'PARENT',
					start: 0,
					end: 1,
					value: '..',
				},
				{
					type: 'SEP',
					start: 2,
					end: 2,
					value: '\\',
				},
				{
					type: 'CURRENT',
					start: 3,
					end: 3,
					value: '.',
				},
				{
					type: 'SEP',
					start: 4,
					end: 4,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 5,
					end: 9,
					value: '?!{..',
					error: 'name "?!{.." contains invalid characters',
				},
				{
					type: 'SEP',
					start: 10,
					end: 10,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 11,
					end: 18,
					value: 'file.txt',
				},
			]);
		});
	});
	describe.skip('dos device path', () => {
		it('empty path ""', () => {
			const answer = Array.from(ddpAbsorber(''));
			expect(answer).toEqual([]);
		});
		it('volume uuid path "\\?\\Volume{b75e2c83-0000-0000-0000-602f00000000}\\Test\\Foo.txt"', () => {
			const answer = Array.from(
				ddpAbsorber('\\\\?\\Volume{b75e2c83-0000-0000-0000-602f00000000}\\Test\\Foo.txt'),
			);
			expect(answer).toEqual([
				{
					type: 'ROOT',
					value: '\\\\?\\Volume{b75e2c83-0000-0000-0000-602f00000000}',
					start: 0,
					end: 47,
				},
				{
					end: 48,
					start: 48,
					type: 'SEP',
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 49,
					end: 52,
					value: 'Test',
				},
				{
					type: 'SEP',
					start: 53,
					end: 53,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 54,
					end: 60,
					value: 'Foo.txt',
				},
			]);
		});
		it('unc path "\\\\?\\UNC\\Server\\Share\\"', () => {
			const answer = Array.from(ddpAbsorber('\\\\?\\UNC\\Server\\Share\\'));
			expect(answer).toEqual([
				{
					type: 'ROOT',
					value: '\\\\?\\UNC\\Server\\Share',
					start: 0,
					end: 19,
				},
				{
					end: 20,
					start: 20,
					type: 'SEP',
					value: '\\',
				},
			]);
		});
		it('unc path "\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt"', () => {
			const answer = Array.from(ddpAbsorber('\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt'));
			expect(answer).toEqual([
				{
					type: 'ROOT',
					value: '\\\\?\\UNC\\Server\\Share',
					start: 0,
					end: 19,
				},
				{
					end: 20,
					start: 20,
					type: 'SEP',
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 21,
					end: 23,
					value: 'Foo',
				},
				{
					type: 'SEP',
					start: 24,
					end: 24,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 25,
					end: 31,
					value: 'bar.txt',
				},
			]);
		});
		it('unc path "\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt"', () => {
			const answer = Array.from(ddpAbsorber('\\\\?\\UNC\\Server\\Share\\Foo\\bar.txt'));
			expect(answer).toEqual([
				{
					type: 'ROOT',
					value: '\\\\?\\UNC\\Server\\Share',
					start: 0,
					end: 19,
				},
				{
					end: 20,
					start: 20,
					type: 'SEP',
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 21,
					end: 23,
					value: 'Foo',
				},
				{
					type: 'SEP',
					start: 24,
					end: 24,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 25,
					end: 31,
					value: 'bar.txt',
				},
			]);
		});
		it('tdp path "\\\\?\\c:\\dir1\\dir2"', () => {
			const answer = Array.from(ddpAbsorber('\\\\?\\c:\\dir1\\dir2'));
			expect(answer).toEqual([
				{
					type: 'ROOT',
					value: '\\\\?\\c:',
					start: 0,
					end: 5,
				},
				{
					end: 6,
					start: 6,
					type: 'SEP',
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 7,
					end: 10,
					value: 'dir1',
				},
				{
					type: 'SEP',
					start: 11,
					end: 11,
					value: '\\',
				},
				{
					type: 'PATHELT',
					start: 12,
					end: 15,
					value: 'dir2',
				},
			]);
		});
		it('unc path "\\\\?\\c:" will be recognized', () => {
			const answer = Array.from(ddpAbsorber('\\\\?\\c:'));
			expect(answer).toEqual([
				{
					end: 5,
					start: 0,
					type: 'ROOT',
					value: '\\\\?\\c:',
				},
			]);
		});
	});
});

import { type Token as FileToken, firstPath } from '@mangos/filepath';
import { describe, expect, it } from 'vitest';
import { RadixNodeImpl } from '../src/RadixNodeImpl';

function getRootToken(): FileToken {
	const pp = firstPath('/', { posix: true });
	if (pp === undefined) throw new Error('ParsedPath is undefined');
	return pp.path[0];
}

function getPathSegments(path: string): FileToken[] {
	const pp = firstPath(path, { posix: true });
	if (pp === undefined) throw new Error('ParsedPath is undefined');
	return pp.path.filter((s, i) => s.value !== '/' || i === 0);
}

function prepareRadix() {
	const rootToken = getRootToken();
	const path1 = getPathSegments('assets/pictures/1.jpg');
	const path2 = getPathSegments('assets/pictures/2.jpg');
    const path3 = getPathSegments('assets/pictures/thumb-nails/2.jpg');
    const path4 = getPathSegments('assets/pictures/thumb-nails/members/user1');

	const root = new RadixNodeImpl<FileToken>(rootToken, undefined);
	const cnt1 = root.insert(path1);
	const cnt2 = root.insert(path2);
	const cnt3 = root.insert(path3);
    root.insert(path4);
	return { cnt1, cnt2, cnt3, root };
}

describe('radix', () => {
	describe('success', () => {
		it('insert token sequence into radix', () => {
			const { cnt1, cnt2, cnt3 } = prepareRadix();

			expect(cnt1).toBe(3);
			expect(cnt2).toBe(1);
			expect(cnt3).toBe(2);
		});
		it('select token sequence into radix', () => {
			const { root } = prepareRadix();
			const assetNode = root.select(getPathSegments('/assets'));
			const jpg1Node = root.select(getPathSegments('/assets/pictures/1.jpg'));
			expect(assetNode?.id()).toEqual({
				end: 5,
				error: undefined,
				start: 0,
				token: '\x06',
				value: 'assets',
			});
			expect(jpg1Node?.id()).toEqual({
				end: 20,
				error: undefined,
				start: 16,
				token: '\x06',
				value: '1.jpg',
			});
		});
        it('pathFromRoot', () => {
			const { root } = prepareRadix();
			const jpg1Node = root.select(getPathSegments('/assets/pictures/1.jpg'));
            const sequence = jpg1Node?.pathFromRoot()
            // "/" is root
            // "asset" is first under root
            // so ["/", "asset"].join('/') is "//asset"
            expect(sequence?.map(s => s.value).join('/').replaceAll('//','/')).toBe('/assets/pictures/1.jpg')
		});
        it('isPathTerminal', () => {
            const { root } = prepareRadix();
            const node = root.isPathTerminal(getPathSegments('/assets/pictures/2.jpg'));
            expect(node).toBeTruthy();
            const partial = root.isPathTerminal(getPathSegments('/assets/pictures'));
            expect(partial).toBeFalsy();
        });
        it('delete', () => {
            const { root } = prepareRadix();
            const deletedNodes = root.delete(getPathSegments('/assets/pictures/thumb-nails/members/user1'));
			// the 2 nodes  /members/user1 where deleted
			expect(deletedNodes).toBe(2)
        })
	});
    describe('error and edge cases', () =>{
        it('empty input handled correctly', ()=> {
            const { root } = prepareRadix();
            const assetNode = root.select([]);
            expect(assetNode).toBeNull();
        });
        it('path segment is not indexed', ()=> {
            const { root } = prepareRadix();
            const assetNode = root.select(getPathSegments('/unknown-path-segment'));
            expect(assetNode).toBeNull();
        });
        it('path segment is longer then indexed', ()=> {
            const { root } = prepareRadix();
            const assetNode = root.select(getPathSegments('/assets/pictures/thumb-nails/members/user1/v2/avatar.jpg'));
            expect(assetNode).toBeNull();
        });
    })
});

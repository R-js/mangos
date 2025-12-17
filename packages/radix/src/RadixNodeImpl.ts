import type { RadixNode } from './types/RadixNode.js';
import type { Token } from './types/Token.js';

export class RadixNodeImpl<T extends Token> implements RadixNode<T> {
	#parent: RadixNode<T> | undefined;
	#id: T;
	#children: RadixNode<T>[];
	constructor(id: T, parent?: RadixNode<T>) {
		this.#parent = parent;
		this.#children = [];
		this.#id = id;
	}
	nrLeafs(): number {
		if (this.#children.length === 0) {
			return 1;
		}
		return this.#children.reduce((sum, child) => {
			return sum + child.nrLeafs();
		}, 0);
	}
	// the path[0] must match one of its children
	delete(path: readonly T[]): number {
		// short circuit
		if (path.length === 0) {
			return 0;
		}
		if (path.length === 1) {
			const findIndex = this.#children.findIndex((child) => child.id().equals(path[0]));
			if (findIndex < 0) {
				return 0;
			}
			if (this.#children[findIndex].children().length > 0) {
				return 0;
			}
			this.#children.splice(findIndex, 1);
			return 1;
		}
		const findIndex = this.#children.findIndex((child) => child.id().equals(path[0]));
		if (findIndex < 0) {
			return 0;
		}
		const changed = 1 + this.#children[findIndex].delete(path.slice(1));
		this.#children.slice(findIndex, 1);
		return changed;
	}
	// the path[0] must match one of its children
	insert(path: readonly T[]): number {
		// short circuit
		if (path.length === 0) {
			return 0;
		}
		// if there are no children that match you must create one and add it
		const find = this.#children.find((child) => child.id().equals(path[0]));
		if (find) {
			return find.insert(path.slice(1));
		}
		const radixNode = new RadixNodeImpl(path[0], this as RadixNode<T>);
		const nrNodes = radixNode.insert(path.slice(1));
		this.#children.push(radixNode);
		return nrNodes;
	}
	select(path: readonly T[]): null | RadixNode<T> {
		// short circuit
		if (path.length === 0) {
			return null;
		}
		// short circuit
		if (!path[0].equals(this.#id)) {
			return null;
		}
		//
		if (path.length === 1) {
			return this as RadixNode<T>;
		}
		// path.length > 1 && path[0] == this.#id
		if (this.#children.length === 0) {
			return null;
		}
		// path.length > 1 && path[0] === this.#id && children.length > 0
		// recursion down the children!!!
		for (const child of this.#children) {
			const result = child.select(path.slice(1));
			if (result !== null) {
				return result;
			}
		}
		return null;
	}
	// the path is not an empty array or it
	isPathTerminal(path: readonly T[]): boolean {
		const radixNode = this.select(path);
		if (radixNode?.children().length === 0) {
			return true;
		}
		return false;
	}
	public children() {
		return this.#children;
	}
	public token() {
		return this.#id;
	}
	public parent(): RadixNode<T> | undefined {
		return this.#parent;
	}
	public pathFromRoot(): T[] {
		return [...(this?.parent()?.pathFromRoot() ?? []), this.#id];
	}
	public id(): T {
		return this.#id;
	}
}

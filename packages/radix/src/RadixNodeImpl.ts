import type { RadixNode } from './types/RadixNode.js';
import type { Token } from './types/Token.js';

export class RadixNodeImpl<T extends Token> implements RadixNode<T> {
	#parent: RadixNodeImpl<T> | undefined;
	#id: T;
	#children: RadixNodeImpl<T>[];
	constructor(id: T, parent?: RadixNodeImpl<T>) {
		this.#parent = parent;
		this.#children = [];
		this.#id = id;
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
		const radixNode = new RadixNodeImpl(path[0], this);
		const nrNodes = 1 + radixNode.insert(path.slice(1));
		this.#children.push(radixNode);
		return nrNodes;
	}
	select(path: readonly T[]): null | RadixNode<T>  {
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
			return this;
		}
		// path.length > 1 && path[0] == this.#id
		if (this.children().length === 0) {
			return null;
		}
		// path.length > 1 && path[0] === this.#id && children.length > 0
		// recursion down the children!!!
		for (const child of this.children()) {
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
	children() {
		return this.#children;
	}
	parent(): RadixNode<T> | undefined {
		return this.#parent;
	}
	pathFromRoot(): T[] { 
		return [...(this?.parent()?.pathFromRoot() ?? []), this.id()];
	}
	public id(): T {
		return this.#id;
    }
	nrLeafs(): number {
		if (this.children().length === 0) {
			return 1;
		}
		return this.children().reduce((sum: number, child) => {
			return sum + child.nrLeafs();
		}, 0);
	}
	// you can only delete terminals
	delete(path: readonly T[]): number {
		// safeguard
		if (path.length === 0) {
			return 0;
		}
		// nothing to do here
		if (!path[0].equals(this.#id)){
			return 0;
		}
		//# path[0] does equal path[0]

		if (path.length === 1) { // we should be at a terminal	
			if (this.#children.length > 0) { //, but we are not at a terminal
				return 0;
			}
			if (!this.#parent) { //, node need parent to delete itself
				return 0;
			}
			const index = this.#parent.#children.indexOf(this);
			this.#parent.#children.splice(index, 1);
			this.#parent = undefined;
			return 1;		
		}
		//# path length > 1
		//# path[0] did match this id
		if (this.#children.length === 0) { // no children to dive into
			return 0;
		}
		// probe next child
		const child = this.#children.find(child => child.#id.equals(path[1]));
		if (child === undefined) {
			return 0;
		}
		//# path length > 1
		//# path[0] did match this id
		//# path[1] did match an item in #children
		const nrNodesChanged = child.delete(path.slice(1));
		// the child has not deleted itself
		if (child.#parent !== undefined) {
			return nrNodesChanged;
		}
		// no oppertunity for rollup
		if (this.#children.length > 0) {
			return nrNodesChanged;
		}
		//# path length > 1
		//# path[0] did match this id
		//# path[1] did match an item in #children
		//# after recursive delete, item in #children was removed
		//# this.#children is an empty array

		// rollup
		if (!this.#parent) {
			return nrNodesChanged;
		}
		//# this.#parent exist
		const index = this.#parent.#children.indexOf(this);
		this.#parent.#children.splice(index, 1);
		this.#parent = undefined;
		return nrNodesChanged + 1;
	}
}

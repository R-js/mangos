import type { Token } from './Token';

export interface RadixNode<T extends Token> {
	nrTerminals(): number; // total leaf count
	// crud
	select(path: readonly T[]): null | RadixNode<T>;

	// the path does not need to end in a terminal node, but it will delete everything under this path,
	// returns only the number of terminals deleted

	delete(this: RadixNode<T>, path: readonly T[]): number;

	// returns 0 if the path already exist
	// returns the number of nodes adjusted including its own insert
	insert(path: readonly T[]): number;

	// only returns true if the path is a vector to a terminal
	isPathTerminal(path: readonly T[]): boolean;

	// get the parent of this radix node
	parent(): RadixNode<T> | undefined;

	// token up to Root
	pathFromRoot(): T[];

	// the tokens on this nesting level
	children(): RadixNode<T>[];

	//id
	id(): T;
}

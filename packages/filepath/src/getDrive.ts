export default function getDrive(str: string): [string, string] {
	const [a, b] = str.slice(0, 2).toLowerCase().split('');
	return [a, b];
}

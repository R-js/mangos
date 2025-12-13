export default function getCWD() {
	if (globalThis?.process) {
		return global.process.cwd();
	}
	if (globalThis?.location?.pathname) {
		return globalThis.location.pathname;
	}
	return '/';
}

function getPlatform(): undefined | string {
	if ('userAgentData' in navigator) {
		return (navigator.userAgentData as { platform: string }).platform.toLowerCase();
	}
	if ('platform' in navigator) {
		return navigator.platform.toLowerCase();
	}
	return process?.platform;
}

export default function mapPlatformNames(): NodeJS.Platform | undefined {
	const platform = getPlatform() ?? 'linux';
	if (platform.includes('win')) {
		return 'win32';
	}
	// if (platform.includes("mac")) {
	// 	return "linux";
	// }
	return 'linux';
}

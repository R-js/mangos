let platformGlobal: undefined | (() => undefined | string);

export function setPlatForm(platform?: () => undefined | string) {
    platformGlobal = platform;
}

function getPlatform(): undefined | string {
    if ('userAgentData' in navigator) {
        return (navigator.userAgentData as { platform: string }).platform.toLowerCase();
    }
    if ('platform' in navigator) {
        return navigator.platform.toLowerCase();
    }
    return process?.platform;
}

export function mapPlatformNames(): NodeJS.Platform | undefined {
    if ((platformGlobal ?? getPlatform)()?.includes('win')) {
        return 'win32';
    }
    return 'linux';
}

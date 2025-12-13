export const rootTokens = {
	POSIX_ROOT: '\x02', // posix
	TDP_ROOT: '\x03', // traditional dos path
	UNC_ROOT: '\x04', // unc root
	DDP_ROOT: '\x05', // dos device path root
} as const;

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			reportsDirectory: './coverage',
			include: ['test/**/*test.{ts,js}'], // adjust as needed
		},
	},
	build: {},
});

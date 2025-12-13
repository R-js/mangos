import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['test/**/*test.{ts,js}'], // ✅ test files
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			reportsDirectory: './coverage',
			include: ['src/**/*.{ts,js}'], // adjust as needed
		},
	},
	build: {},
});

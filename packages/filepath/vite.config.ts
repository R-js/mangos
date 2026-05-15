import { defineConfig } from 'vitest/config';
import typescript from '@rollup/plugin-typescript';

export default defineConfig({
    test: {
        maxWorkers: 1,
        environment: 'node',
        include: ['test/**/*test.{ts,js}'], // ✅ test files
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            reportsDirectory: './coverage',
            include: ['src/**/*.{ts,js}'], // adjust as needed
        },
    },
    build: {
        minify: false,
        lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: 'index',
        },
        rollupOptions: {
            plugins: [
                typescript(),
            ],
            output: {
                preserveModules: true,
                preserveModulesRoot: 'src',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
            },
        },
        emptyOutDir: true,
    },
});

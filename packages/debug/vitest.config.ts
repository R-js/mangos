import path from 'node:path';
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts'],
        // you might want to disable it, if you don't have tests that rely on CSS
        // since parsing CSS is slow
        exclude: [...configDefaults.exclude]
    },
    resolve: {
        alias: {
            '@ns': path.resolve(__dirname, './src/ns'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@src': path.resolve(__dirname, './src')
        }
    }
});

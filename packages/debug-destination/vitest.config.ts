import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        setupFiles: ['./src/setupTests.ts'],
        // you might want to disable it, if you don't have tests that rely on CSS
        // since parsing CSS is slow
        exclude: [...configDefaults.exclude],
        include: ['src/index.test.ts'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts']
        }
    }
});

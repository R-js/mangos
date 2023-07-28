import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import typescript from '@rollup/plugin-typescript';
import path from 'node:path';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        sourcemap: true,
        manifest: true,
        minify: false,
        reportCompressedSize: true,
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            fileName: 'main',
            formats: ['cjs', 'es']
        },
        rollupOptions: {
            external: [],
            plugins: [
                typescriptPaths({
                    preserveExtensions: true
                }),
                typescript({
                    sourceMap: false,
                    declaration: true,
                    outDir: 'dist/types'
                })
            ]
        }
    },
    plugins: [eslint()],
    resolve: {
        alias: [
            {
                find: '~',
                replacement: path.resolve(__dirname, './src')
            }
        ]
    }
});

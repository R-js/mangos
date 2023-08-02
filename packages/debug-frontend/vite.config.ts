import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import typescript from '@rollup/plugin-typescript';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        sourcemap: false,
        manifest: false,
        minify: false,
        reportCompressedSize: true,
        lib: {
            entry: {
                'index': path.resolve(__dirname, 'src/index.ts')
            },
            formats: ['cjs', 'es']
        },
        rollupOptions: {
            external: [],
            plugins: [
                typescript({
                    sourceMap: false,
                    declaration: true,
                    outDir: 'dist/types'
                })
            ]
        }
    },
    plugins: [eslint()]
});

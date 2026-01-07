/// <reference types="vitest" />
import path from 'path';

import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1'),
      },
      {
        find: /^@\/(.+)/,
        replacement: path.join(process.cwd(), 'src/$1'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/unit/**/*.spec.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules', 'out', 'src/test', 'src/typings', '.vscode-test'],
    },
  },
});

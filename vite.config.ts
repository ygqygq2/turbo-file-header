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
      // 覆盖率下限兜底，防止回归（当前基线约 39%，后续可逐步收紧）
      thresholds: {
        statements: 38,
        branches: 37,
        functions: 36,
        lines: 38,
      },
    },
  },
});

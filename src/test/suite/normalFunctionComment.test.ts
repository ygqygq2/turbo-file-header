import { functionCommentTester } from './common/functionCommentTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'normalFunction',
    workspaceName: 'function-comment-for-ts',
    files: [
      { fileName: 'function-none-params-with-return-type.ts', cursorLine: 0 },
      { fileName: 'function-none-params-without-return-type.js', cursorLine: 0 },
      { fileName: 'function-none-params-without-return-type.ts', cursorLine: 0 },
      { fileName: 'function-with-params-type-update.ts', cursorLine: 0 },
      { fileName: 'function-with-params-type.ts', cursorLine: 0 },
      { fileName: 'function-without-params-type.js', cursorLine: 0 },
      { fileName: 'function-without-params-type.ts', cursorLine: 0 },
    ],
  },
];

functionCommentTester(testInfo);

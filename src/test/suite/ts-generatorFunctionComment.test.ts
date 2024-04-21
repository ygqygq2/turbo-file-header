import { functionCommentTester } from './common/functionCommentTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'ts-generatorFunction',
    workspaceName: 'function-comment-for-ts',
    files: [
      { fileName: 'generator-function-optional-params-type.ts', cursorLine: 0 },
      { fileName: 'generator-function-with-params-type.ts', cursorLine: 0 },
      { fileName: 'generator-function-without-params-type.ts', cursorLine: 0 },
      { fileName: 'generator-function-without-params-type.js', cursorLine: 0 },
    ],
  },
];

functionCommentTester(testInfo);

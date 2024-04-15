import { functionCommentTester } from './common/functionCommentTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    workspaceName: 'function-comment',
    files: [
      { fileName: 'variable-arrow-function-with-params-type.ts', cursorLine: 0 },
      { fileName: 'variable-arrow-function-without-params-type.ts', cursorLine: 0 },
      { fileName: 'variable-arrow-function-without-params-type.js', cursorLine: 0 },
      { fileName: 'variable-arrow-function-with-params-type-update.ts', cursorLine: 6 },
      { fileName: 'arrow-function-without-params-type.ts', cursorLine: 0 },
    ],
  },
];

functionCommentTester(testInfo);

import { functionCommentTester } from './common/functionCommentTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'c-function',
    workspaceName: 'function-comment-for-c',
    files: [
      { fileName: 'function-none-params-without-return.c', cursorLine: 0 },
      { fileName: 'function-with-params-with-return.c', cursorLine: 0 },
    ],
  },
];

functionCommentTester(testInfo);

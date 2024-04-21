import { functionCommentTester } from './common/functionCommentTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'go-function',
    workspaceName: 'function-comment-for-go',
    files: [
      { fileName: 'function-none-params-with-return.go', cursorLine: 0 },
      { fileName: 'function-none-params-without-return.go', cursorLine: 0 },
      { fileName: 'function-with-params-type-with-return.go', cursorLine: 0 },
      { fileName: 'function-with-params-type-without-return.go', cursorLine: 0 },
    ],
  },
];

functionCommentTester(testInfo);

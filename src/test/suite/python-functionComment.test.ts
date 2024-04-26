import { functionCommentTester } from './common/functionCommentTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'python-function',
    workspaceName: 'function-comment-for-python',
    files: [
      { fileName: 'function-none-params-with-return.py', cursorLine: 0 },
      { fileName: 'function-none-params-without-return.py', cursorLine: 0 },
      { fileName: 'function-optional-params-with-return.py', cursorLine: 0 },
      { fileName: 'function-with-params-without-return.py', cursorLine: 0 },
    ],
  },
];

functionCommentTester(testInfo);

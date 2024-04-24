import { functionCommentTester } from './common/functionCommentTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'java-function',
    workspaceName: 'function-comment-for-java',
    files: [
      { fileName: 'function-none-params-with-return.java', cursorLine: 0 },
      { fileName: 'function-with-params-with-return.java', cursorLine: 0 },
    ],
  },
];

functionCommentTester(testInfo);

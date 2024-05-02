import { functionCommentTester } from './common/functionCommentTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'rust-function',
    workspaceName: 'function-comment-for-rust',
    files: [
      { fileName: 'function-none-params-with-return.rs', cursorLine: 0 },
      { fileName: 'function-none-params-without-return.rs', cursorLine: 0 },
      { fileName: 'function-with-params-with-return.rs', cursorLine: 0 },
      { fileName: 'function-with-params-without-return.rs', cursorLine: 0 },
    ],
  },
];

functionCommentTester(testInfo);

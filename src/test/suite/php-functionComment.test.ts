import { functionCommentTester } from './common/functionCommentTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'php-function',
    workspaceName: 'function-comment-for-php',
    files: [
      { fileName: 'function-none-params-with-return.php', cursorLine: 0 },
      { fileName: 'function-none-params-without-return.php', cursorLine: 0 },
      { fileName: 'function-optional-params-with-return.php', cursorLine: 0 },
      { fileName: 'function-with-params-with-return.php', cursorLine: 0 },
      { fileName: 'function-with-params-without-return.php', cursorLine: 0 },
    ],
  },
];

functionCommentTester(testInfo);

import { functionCommentTester } from './common/functionCommentTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'normalFunction',
    workspaceName: 'function-comment',
    files: [{ fileName: 'function-with-params-type.ts', cursorLine: 0 }],
  },
];

functionCommentTester(testInfo);

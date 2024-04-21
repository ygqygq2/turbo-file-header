import { functionCommentTester } from './common/functionCommentTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'ts-classMethod',
    workspaceName: 'function-comment-for-ts',
    files: [
      { fileName: 'class-construct-with-params-type.ts', cursorLine: 1 },
      { fileName: 'class-construct-without-params-type.js', cursorLine: 1 },
      { fileName: 'class-construct-without-params-type.ts', cursorLine: 1 },
      { fileName: 'class-get-optional-params-with-type.ts', cursorLine: 1 },
      { fileName: 'class-get-without-params-type.js', cursorLine: 1 },
      { fileName: 'class-get-without-params-type.ts', cursorLine: 1 },
      { fileName: 'class-public-optional-params-with-type.ts', cursorLine: 1 },
      { fileName: 'class-public-optional-params-without-type.js', cursorLine: 1 },
      { fileName: 'class-public-optional-params-without-type.ts', cursorLine: 1 },
      { fileName: 'class-private-without-params-type.js', cursorLine: 1 },
      { fileName: 'class-private-without-params-type.ts', cursorLine: 1 },
      { fileName: 'class-public-with-params-type.ts', cursorLine: 1 },
    ],
  },
];

functionCommentTester(testInfo);

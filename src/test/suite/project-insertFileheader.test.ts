import { fileheaderTester } from './common/fileheaderTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'project-insertFileheader',
    workspaceName: 'file-header-project',
    files: [
      { fileName: 'no-fileheader.js', cursorLine: 0 },
      { fileName: 'no-fileheader.ts', cursorLine: 0 },
      { fileName: 'no-fileheader.go', cursorLine: 0 },
      { fileName: 'no-fileheader.sh', cursorLine: 0 },
      { fileName: 'no-fileheader.java', cursorLine: 0 },
    ],
  },
];

fileheaderTester(testInfo);

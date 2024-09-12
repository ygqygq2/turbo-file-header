import { fileheaderTester } from './common/fileheaderTester';
import { TestInfo } from './types';

const testInfo: TestInfo = [
  {
    testName: 'project-updateFileheader',
    workspaceName: 'file-header-project',
    files: [
      { fileName: 'fileheader-update.js', cursorLine: 0 },
      { fileName: 'fileheader-update.ts', cursorLine: 0 },
      { fileName: 'fileheader-update.go', cursorLine: 0 },
      { fileName: 'fileheader-update.sh', cursorLine: 0 },
      { fileName: 'fileheader-update.java', cursorLine: 0 },
    ],
  },
];

fileheaderTester(testInfo);

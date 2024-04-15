import assert from 'assert';
import { describe, it } from 'mocha';

import { executeCommandOnFile } from './common/executeCommandOnFile';

const testInfo = [
  {
    workspaceName: 'file-header',
    files: [
      { fileName: 'no-fileheader.js', cursorLine: 0 },
      { fileName: 'no-fileheader.ts', cursorLine: 0 },
      { fileName: 'no-fileheader.go', cursorLine: 0 },
    ],
  },
];

describe('Extension Integration Test: addFileheader', function () {
  this.timeout(100000);

  testInfo.forEach((item) => {
    const workspaceName = item.workspaceName;
    const files = item.files;
    files.forEach((fileInfo) => {
      const fileName = fileInfo.fileName;
      const cursorLine = fileInfo.cursorLine;
      it(`should add file header for [${fileName}]`, async () => {
        const commandName = 'turboFileHeader.addFileheader';
        const { actual } = await executeCommandOnFile(
          commandName,
          workspaceName,
          fileName,
          cursorLine,
          false,
        );
        // 有 Copyright 字符串即可
        assert.notEqual(actual.indexOf('Copyright'), -1);
        // @description 后面有非空格字符
        assert.match(actual, /@description\s+\S+/);
      });
    });
  });
});

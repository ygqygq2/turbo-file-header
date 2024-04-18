import assert from 'assert';
import { describe, it } from 'mocha';

import { TestInfo } from '../types';
import { executeCommandOnFile } from './executeCommandOnFile';

export function fileheaderTester(testInfo: TestInfo) {
  testInfo.forEach((item) => {
    describe(`Extension Integration Test: addFileheader for [${item.testName}]`, function () {
      this.timeout(200000);
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
}

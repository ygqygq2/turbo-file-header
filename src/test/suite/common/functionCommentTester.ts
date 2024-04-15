import assert from 'assert';
import { describe, it } from 'mocha';
import path from 'path';

import { getText } from '@/utils/vscode-utils';

import { TestInfo } from '../types';
import { executeCommandOnFile } from './executeCommandOnFile';

export function functionCommentTester(testInfo: TestInfo) {
  describe('Extension Integration Test: addFunctionComment', function () {
    this.timeout(100000);

    testInfo.forEach((item) => {
      const workspaceName = item.workspaceName;
      const files = item.files;
      files.forEach((fileInfo) => {
        const fileName = fileInfo.fileName;
        const cursorLine = fileInfo.cursorLine;
        const ext = path.extname(fileName);
        it(`should add function comment for [${ext}] in file ${fileName}`, async () => {
          const commandName = 'turboFileHeader.addFunctionComment';
          const resultFileName = fileName.replace(ext, `.result${ext}`);
          const { actual } = await executeCommandOnFile(
            commandName,
            workspaceName,
            fileName,
            cursorLine,
            false,
          );
          const expected = await getText(workspaceName, resultFileName);
          assert.equal(actual, expected);
        });
      });
    });
  });
}

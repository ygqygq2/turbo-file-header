import assert from 'assert';
import { describe, it } from 'mocha';
import path from 'path';

import { getText } from '@/utils/vscode-utils';

import { executeCommandOnFile } from './common/executeCommandOnFile';

const testInfo = [
  {
    workspaceName: 'function-comment',
    files: [
      { fileName: 'variable-arrow-function-with-params-type.ts', cursorLine: 0 },
      { fileName: 'variable-arrow-function-without-params-type.ts', cursorLine: 0 },
      { fileName: 'variable-arrow-function-without-params-type.js', cursorLine: 0 },
      { fileName: 'variable-arrow-function-with-params-type-update.ts', cursorLine: 6 },
    ],
  },
];

describe('Extension Integration Test: addFunctionComment', function () {
  this.timeout(20000);

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

import { getText } from '@/utils/vscode-utils';
import assert from 'assert';
import { describe, it } from 'mocha';
import { executeCommandOnFile } from './executeCommandOnFile';

describe('Extension Integration Test: addFileheader', function () {
  this.timeout(10000);
  it('should add file header for [.ts]', async () => {
    const commandName = 'turboFileHeader.addFileheader';
    const workspaceName = 'file-header';
    const fileName = 'no-fileheader.ts';
    const resultFileName = 'no-fileheader.result.ts';
    const { actual } = await executeCommandOnFile(commandName, workspaceName, fileName, true);
    console.log('🚀 ~ file: addFileheader.test.ts:14 ~ actual:', actual);
    const expected = await getText(workspaceName, resultFileName);
    assert.equal(actual, expected);
  });
});

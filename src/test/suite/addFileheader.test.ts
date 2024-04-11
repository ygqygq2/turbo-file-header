import assert from 'assert';
import { describe, it } from 'mocha';
import { executeCommandOnFile } from './executeCommandOnFile';

describe('Extension Integration Test: addFileheader', function () {
  this.timeout(20000);
  it('should add file header for [.ts]', async () => {
    const commandName = 'turboFileHeader.addFileheader';
    const workspaceName = 'file-header';
    const fileName = 'no-fileheader.ts';
    const { actual } = await executeCommandOnFile(commandName, workspaceName, fileName, false);
    console.log('🚀 ~ file: addFileheader.test.ts:14 ~ actual:', actual);
    // 有 Copyright 字符串即可
    assert.notEqual(actual.indexOf('Copyright'), -1);
  });
});

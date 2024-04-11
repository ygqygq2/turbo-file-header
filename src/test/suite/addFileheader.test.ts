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
    // 有 Copyright 字符串即可
    assert.notEqual(actual.indexOf('Copyright'), -1);
    // @description 后面有非空格字符
    assert.match(actual, /@description\s+\S+/);
  });

  it('should add file header for [.go]', async () => {
    const commandName = 'turboFileHeader.addFileheader';
    const workspaceName = 'file-header';
    const fileName = 'no-fileheader.go';
    const { actual } = await executeCommandOnFile(commandName, workspaceName, fileName, false);
    assert.notEqual(actual.indexOf('Copyright'), -1);
    assert.match(actual, /@description\s+\S+/);
  });
});

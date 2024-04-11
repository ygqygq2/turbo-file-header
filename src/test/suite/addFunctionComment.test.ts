import { getText } from '@/utils/vscode-utils';
import assert from 'assert';
import { describe, it } from 'mocha';
import { executeCommandOnFile } from './executeCommandOnFile';

describe('Extension Integration Test: addFunctionComment', function () {
  this.timeout(10000);
  it('should add function comment for [.ts]', async () => {
    const commandName = 'turboFileHeader.addFunctionComment';
    const workspaceName = 'function-comment';
    const fileName = 'variable-arrow-function-with-params-type.ts';
    const resultFileName = 'variable-arrow-function-with-params-type.result.ts';
    const { actual } = await executeCommandOnFile(commandName, workspaceName, fileName, true);
    const expected = await getText(workspaceName, resultFileName);
    assert.equal(actual, expected);
  });
});

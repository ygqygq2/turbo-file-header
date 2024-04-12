import assert from 'assert';
import { describe, it } from 'mocha';

import { getText } from '@/utils/vscode-utils';

import { executeCommandOnFile } from './common/executeCommandOnFile';

describe('Extension Integration Test: addFunctionComment', function () {
  this.timeout(20000);
  it('should add function comment for [.ts]', async () => {
    const commandName = 'turboFileHeader.addFunctionComment';
    const workspaceName = 'function-comment';
    const fileName = 'variable-arrow-function-with-params-type.ts';
    const resultFileName = 'variable-arrow-function-with-params-type.result.ts';
    const { actual } = await executeCommandOnFile(commandName, workspaceName, fileName, false);
    console.log('🚀 ~ file: addFunctionComment.test.ts:16 ~ actual:', actual);
    const expected = await getText(workspaceName, resultFileName);
    console.log('🚀 ~ file: addFunctionComment.test.ts:18 ~ expected:', expected);
    assert.equal(actual, expected);
  });
});

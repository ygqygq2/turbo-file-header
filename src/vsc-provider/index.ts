import assert from 'assert';
import { BaseVCSProvider } from './types';
import { GitVCSProvider } from './GitVCSProvider';

function createVCSProvider(): BaseVCSProvider {
  return new GitVCSProvider();
}

const vscProvider = createVCSProvider();
// 断言确保 vscProvider 不为 null
assert.ok(vscProvider, 'vscProvider is not found.');

if (!vscProvider) {
  throw new Error('vscProvider is null.');
}

export { vscProvider };

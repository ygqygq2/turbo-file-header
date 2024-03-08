import { createVCSProvider } from './vcs-provider';
import { BaseVCSProvider } from './vcs-provider/BaseVCSProvider';

let vcsProvider: BaseVCSProvider;
export async function initVCSProvider(): Promise<BaseVCSProvider> {
  if (!vcsProvider) {
    // createVCSProvider 中已经做了错误处理，这里肯定是成功的
    vcsProvider = (await createVCSProvider()) as unknown as BaseVCSProvider;
  }
  return vcsProvider;
}

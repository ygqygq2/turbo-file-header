import { createVCSProvider } from './vcs-provider';
import { BaseVCSProvider } from './vcs-provider/BaseVCSProvider';

let vcsProvider: BaseVCSProvider;
(async () => {
  vcsProvider = (await createVCSProvider()) as BaseVCSProvider;
  if (vcsProvider instanceof BaseVCSProvider) {
    console.log('VCS Provider created');
  } else {
    console.log('VCS Provider not created');
  }
})();
export { vcsProvider };

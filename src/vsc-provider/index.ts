import { BaseVCSProvider } from './types';
import { GitVCSProvider } from './GitVCSProvider';
import { CustomError, errorHandler } from '@/error/ErrorHandler';
import { ErrorCode } from '@/error/ErrorCodeMessage.enum';

function createVCSProvider(): BaseVCSProvider {
  return new GitVCSProvider();
}

let vscProvider: BaseVCSProvider;

try {
  vscProvider = createVCSProvider();
} catch (error) {
  errorHandler.handle(new CustomError('Error creating VCS provider', ErrorCode.NoVCSProvider));
}

export { vscProvider };

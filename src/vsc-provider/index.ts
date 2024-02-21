import { BaseVCSProvider } from './types';
import { GitVCSProvider } from './GitVCSProvider';
import { CustomError } from '@/error/ErrorHandler';
import { ErrorCode } from '@/error/ErrorCodeMessage.enum';
import { errorHandler } from '@/extension';

function createVCSProvider(): BaseVCSProvider {
  return new GitVCSProvider();
}

let vscProvider: BaseVCSProvider;

try {
  vscProvider = createVCSProvider();
} catch (error) {
  errorHandler.handle(new CustomError(ErrorCode.NoVCSProvider));
}

export { vscProvider };

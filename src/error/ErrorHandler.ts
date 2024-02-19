import { ErrorCode, errorCodeMessages } from './ErrorCodeMessage.enum';
import output from './output';

export class CustomError extends Error {
  code: ErrorCode;
  originalError: Error | undefined | unknown;

  constructor(code: ErrorCode, originalError?: Error | unknown) {
    super(errorCodeMessages[code]);
    this.code = code;
    this.originalError = originalError;
  }
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private constructor() {
    // 私有构造函数
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handle(error: CustomError) {
    if (error.originalError) {
      output.error(error.originalError);
    }
    output.error(error.message);
  }
}

export const errorHandler = ErrorHandler.getInstance();

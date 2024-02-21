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

export class ErrorHandler {
  private static instance: ErrorHandler;
  private constructor() {
    // 私有构造函数
  }

  static getInstance(): ErrorHandler {
    return ErrorHandler.instance || (ErrorHandler.instance = new ErrorHandler());
  }

  public handle(error: CustomError) {
    output.error?.(error.originalError);
    output.error?.(error.message);
  }

  public throw(error: CustomError) {
    output.error?.(error.originalError);
    throw error.message;
  }
}

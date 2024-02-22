import { log } from '@/utils/log';
import { ErrorCode, errorCodeMessages } from './ErrorCodeMessage.enum';
import output from './output';

export class CustomError extends Error {
  code: ErrorCode;
  originalError: Error | undefined | unknown;

  constructor(code: ErrorCode, ...args: unknown[]) {
    // 如果只有一个元素
    if (args && args.length === 1) {
      const arg = args[0];
      if (typeof arg === 'string') {
        // 如果是字符串，则将它添加到错误消息中
        super(`${errorCodeMessages[code]}${arg}`);
      } else if (arg instanceof Error) {
        // 如果是 Error 对象，设置 originError 为这个对象
        super(errorCodeMessages[code]);
        this.originalError = args;
      } else {
        super(errorCodeMessages[code]);
      }
    } else if (args && args.length > 1) {
      // 从args中找到第一个Error对象
      const errorObj = args.find((arg) => arg instanceof Error) as Error | undefined;
      // 过滤掉Error对象，只留下其它类型的参数
      const otherArgs = args.filter((arg) => !(arg instanceof Error));
      super(`${errorCodeMessages[code]}${log(otherArgs)}`);
      this.originalError = errorObj;
    } else {
      super(errorCodeMessages[code]);
    }
    this.code = code;
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
    if (error.originalError instanceof Error) {
      output.error?.(error.originalError?.message);
    }
    output.error?.(error.message);
  }

  public throw(error: CustomError) {
    if (error.originalError instanceof Error) {
      output.error?.(error.originalError?.message);
    }
    throw error.message;
  }
}

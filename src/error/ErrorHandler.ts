import * as vscode from 'vscode';
import { ErrorCode } from './ErrorCodeMessage.enum';

export class CustomError extends Error {
  code: ErrorCode;
  originalError: Error | undefined | unknown;

  constructor(code: ErrorCode, message: string, originalError?: Error | unknown) {
    super(message);
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
    console.error(error.originalError);
    switch (error.code) {
      case ErrorCode.MissingUserNameEmail:
        vscode.window.showErrorMessage(
          'Missing user name or email configuration. Please configure them.',
        );
        break;
      case ErrorCode.NoVCSProvider:
        vscode.window.showErrorMessage(
          'No version control provider initialized. Please initialize Git.',
        );
        break;
      default:
        vscode.window.showErrorMessage(error.message);
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();

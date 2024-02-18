import * as vscode from 'vscode';
import { ErrorCode } from './ErrorHandler.enum';

export class CustomError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
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

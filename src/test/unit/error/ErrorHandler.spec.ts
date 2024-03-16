import { expect, describe, it, vi, beforeEach } from 'vitest';
import { CustomError, ErrorHandler } from '@/error/ErrorHandler';
import { ErrorCode, errorCodeMessages } from '@/error';

vi.mock('vscode');

describe('CustomError', () => {
  it('should create an instance with error code', () => {
    const code = ErrorCode.GitNotInit;
    const message = errorCodeMessages[ErrorCode.GitNotInit];
    const error = new CustomError(code);

    expect(error.code).toBe(code);
    expect(error.message).toBe(message);
    expect(error.originalError).toBeUndefined();
  });

  it('should create an instance with error code and Error object', () => {
    const code = ErrorCode.GitNotInit;
    const message = errorCodeMessages[ErrorCode.GitNotInit];
    const originalError = new Error('Original error');

    const error = new CustomError(code, originalError);

    expect(error.code).toBe(code);
    expect(error.message).toBe(`${message}`);
    expect(error.originalError).toBe(originalError);
  });

  it('should create an instance with error code and multiple arguments', () => {
    const code = ErrorCode.GitNotInit;
    const message = errorCodeMessages[ErrorCode.GitNotInit];
    const arg1 = 'Argument 1';
    const arg2 = 'Argument 2';
    const originalError = new Error('Original error');

    const error = new CustomError(code, arg1, arg2, originalError);

    expect(error.code).toBe(code);
    expect(error.message).toBe(`${message}${arg1}, ${arg2}`);
    expect(error.originalError).toBe(originalError);
  });
});

describe.todo('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
  });

  describe('handle', () => {
    it('should handle error with original error message', () => {
      const error = new CustomError(ErrorCode.GitNotInit);
      console.log(errorHandler.handle(error));
      expect(() => errorHandler.handle(error)).not.toThrow();
    });

    it('should handle error with custom error message', () => {
      const error = new CustomError(ErrorCode.GitNotInit);
      errorHandler.handle(error);
    });
  });

  describe.todo('throw', () => {
    it('should throw error with original error message', () => {
      const error = new CustomError(ErrorCode.GitNotInit, new Error('Original error'));
      expect(() => errorHandler.throw(error)).toThrow(error);
    });

    it('should throw error with custom error message', () => {
      const error = new CustomError(ErrorCode.GitNotInit);

      expect(() => errorHandler.throw(error)).toThrow(error);
    });
  });
});

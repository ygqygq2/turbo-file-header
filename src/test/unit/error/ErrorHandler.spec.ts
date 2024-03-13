import { expect, describe, it, vi } from 'vitest';
import { CustomError } from '@/error/ErrorHandler';
import { ErrorCode, errorCodeMessages } from '@/error';

vi.mock('vscode');

describe.todo('CustomError', () => {
  it('should create an instance with error code and message', () => {
    const code = ErrorCode.GitNotInit;
    const message = errorCodeMessages[ErrorCode.GitNotInit];
    const error = new CustomError(code, message);

    expect(error.code).toBe(code);
    expect(error.message).toBe(`${code}: ${message}`);
    expect(error.originalError).toBeUndefined();
  });

  it('should create an instance with error code and Error object', () => {
    const code = ErrorCode.GitNotInit;
    const message = errorCodeMessages[ErrorCode.GitNotInit];
    const originalError = new Error('Original error');

    const error = new CustomError(code, originalError);

    expect(error.code).toBe(code);
    expect(error.message).toBe(code);
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
    expect(error.message).toBe(`${code}: ${arg1}, ${arg2}`);
    expect(error.originalError).toBe(originalError);
  });

  it('should create an instance with error code and no arguments', () => {
    const code = ErrorCode.GitNotInit;
    const message = errorCodeMessages[ErrorCode.GitNotInit];

    const error = new CustomError(code);

    expect(error.code).toBe(code);
    expect(error.message).toBe(code);
    expect(error.originalError).toBeUndefined();
  });
});

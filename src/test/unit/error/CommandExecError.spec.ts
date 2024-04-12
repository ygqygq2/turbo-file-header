import { ExecException } from 'child_process';
import { describe, expect, it } from 'vitest';

import { CommandExecError } from '@/error/CommandExecError';

describe('CommandExecError', () => {
  it('should create an instance with all properties', () => {
    const stderr = 'Error output';
    const stdout = 'Output';
    const err = new Error('ExecException');

    const error = new CommandExecError(stderr, stdout, err);

    expect(error.message).toBe(`CommandExecError: ${stderr}`);
    expect(error.stderr).toBe(stderr);
    expect(error.stdout).toBe(stdout);
    expect(error.err).toBe(err);
  });

  it('should handle null stderr and non-null stdout', () => {
    const stderr = '';
    const stdout = 'Output';
    const err = '' as unknown as ExecException;

    const error = new CommandExecError(stderr, stdout, err);

    expect(error.message).toBe('CommandExecError: ');
    expect(error.stderr).toBe(stderr);
    expect(error.stdout).toBe(stdout);
    expect(error.err).toBe(err);
  });

  it('should handle non-null stderr and null stdout', () => {
    const stderr = 'Error output';
    const stdout = '';
    const err = '' as unknown as ExecException;

    const error = new CommandExecError(stderr, stdout as unknown as string, err);

    expect(error.message).toBe(`CommandExecError: ${stderr}`);
    expect(error.stderr).toBe(stderr);
    expect(error.stdout).toBe(stdout);
    expect(error.err).toBe(err);
  });

  it('should handle null stderr and null stdout', () => {
    const stderr = '';
    const stdout = '';
    const err: ExecException = null as unknown as ExecException;

    const error = new CommandExecError(stderr, stdout, err);

    expect(error.message).toBe('CommandExecError: ');
    expect(error.stderr).toBe(stderr);
    expect(error.stdout).toBe(stdout);
    expect(error.err).toBe(err);
  });
});

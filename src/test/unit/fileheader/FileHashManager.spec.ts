import { beforeEach, describe, expect, it } from 'vitest';
import * as vscode from 'vscode';

import { FileHashManager } from '@/fileheader/FileHashManager';

describe('FileHashManager', () => {
  let hashManager: FileHashManager;

  beforeEach(() => {
    hashManager = new FileHashManager();
  });

  it('should calculate hash for document', () => {
    const mockDocument = {
      uri: { fsPath: '/test/file.ts' },
      getText: () => 'test content',
    } as vscode.TextDocument;

    hashManager.set(mockDocument);

    expect(hashManager.originRecords.size).toBe(1);
    expect(hashManager.originRecords.has('/test/file.ts')).toBe(true);
  });

  it('should detect hash update for modified document', () => {
    const mockDocument = {
      uri: { fsPath: '/test/file.ts' },
      getText: () => 'original content',
    } as vscode.TextDocument;

    hashManager.set(mockDocument);

    // Simulate modification
    mockDocument.getText = () => 'modified content';
    hashManager.set(mockDocument);

    expect(hashManager.isHashUpdated(mockDocument)).toBe(true);
  });

  it('should not detect hash update for unchanged document', () => {
    const mockDocument = {
      uri: { fsPath: '/test/file.ts' },
      getText: () => 'same content',
    } as vscode.TextDocument;

    hashManager.set(mockDocument);
    hashManager.set(mockDocument);

    expect(hashManager.isHashUpdated(mockDocument)).toBe(false);
  });

  it('should remove document hash records', () => {
    const mockDocument = {
      uri: { fsPath: '/test/file.ts' },
      getText: () => 'test content',
    } as vscode.TextDocument;

    hashManager.set(mockDocument);
    hashManager.remove(mockDocument);

    expect(hashManager.originRecords.has('/test/file.ts')).toBe(false);
    expect(hashManager.records.has('/test/file.ts')).toBe(false);
  });

  it('should track main text updates', () => {
    const mockDocument = {
      uri: { fsPath: '/test/file.ts' },
      getText: () => '',
    } as vscode.TextDocument;

    const mainText1 = 'main text content';
    const isUpdated1 = hashManager.isMainTextUpdated(mockDocument, mainText1);
    expect(isUpdated1).toBe(true);

    // Same text should not be updated
    const isUpdated2 = hashManager.isMainTextUpdated(mockDocument, mainText1);
    expect(isUpdated2).toBe(false);

    // Different text should be updated
    const mainText2 = 'different main text';
    const isUpdated3 = hashManager.isMainTextUpdated(mockDocument, mainText2);
    expect(isUpdated3).toBe(true);
  });
});

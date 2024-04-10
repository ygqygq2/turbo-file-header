import assert from 'assert';
import { describe, it } from 'mocha';
import path from 'path';
import * as vscode from 'vscode';

describe('Extension Integration Test', () => {
  it('should activate the extension', async () => {
    const extension = vscode.extensions.getExtension('ygqygq2.turbo-file-header');
    await extension?.activate();
    const workspaceFolder = vscode.workspace?.workspaceFolders?.[0]?.uri.fsPath ?? '';
    const file = path.join(workspaceFolder, 'files', 'to-test-command-addFileheader.ts');
    const doc = await vscode.workspace.openTextDocument(file);
    const originalContent = doc.getText();
    // await vscode.window.showTextDocument(doc);
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await vscode.commands.executeCommand('turboFileHeader.addFileheader', editor);
    }
    const newContent = doc.getText();
    assert.notStrictEqual(originalContent, newContent);
  });
});

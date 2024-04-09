import assert from 'assert';
import { describe, it } from 'mocha';
import path from 'path';
import * as vscode from 'vscode';

describe('e2e test for command: addFileheader', () => {
  it('should add file header to the current file', async () => {
    const workspaceFolder = vscode.workspace?.workspaceFolders?.[0]?.uri.fsPath ?? '';
    // 打开一个文件
    const file = path.join(workspaceFolder, 'files', 'to-test-command-addFileheader.ts');
    const doc = await vscode.workspace.openTextDocument(file);
    // 获取原始文件内容
    const originalContent = doc.getText();
    // 显示这个文件
    await vscode.window.showTextDocument(doc);
    // 执行 addFileheader 命令
    await vscode.commands.executeCommand('turboFileHeader.addFileheader');
    // 获取新的文件内容
    const newContent = doc.getText();
    // 检查文件内容是否已经变化
    assert.notStrictEqual(originalContent, newContent);
  });
});

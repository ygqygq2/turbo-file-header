import { addFileheader } from '@/commands/addFileheader';
import path from 'path';
import * as vscode from 'vscode';
import assert from 'assert';

describe('e2e test for command: addFileheader', () => {
  it('should add file header to the current file', async () => {
    // 打开一个文件
    const file = path.join(__dirname, 'files', 'to-test-command-addFileheader.ts');
    const doc = await vscode.workspace.openTextDocument(file);
    // 显示这个文件
    await vscode.window.showTextDocument(doc);
    // 执行 addFileheader 命令
    vscode.commands.registerCommand('turboFileHeader.addFileheader', addFileheader().handler);
    await vscode.commands.executeCommand('turboFileHeader.addFileheader');
    // 检查文件头是否已经添加
    const firstLine = doc.lineAt(0);
    assert(firstLine.text.includes('expected header content'));
  });
});

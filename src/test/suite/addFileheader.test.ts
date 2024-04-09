import assert from 'assert';
import { describe, it } from 'mocha';
import path from 'path';
import * as vscode from 'vscode';

describe('e2e test for command: addFileheader', () => {
  let workspaceFolder: string;

  before(() => {
    const projectRoot = path.resolve(__dirname, '../../../');
    workspaceFolder = path.resolve(projectRoot, './sampleWorkspace');
    vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.file(workspaceFolder) });
  });

  it('should add file header to the current file', async () => {
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

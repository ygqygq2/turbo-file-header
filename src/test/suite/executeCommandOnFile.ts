import { sleep } from '@/utils/utils';
import { getWorkspaceFolderUri, setActiveWorkspaceByName } from '@/utils/vscode-utils';
import * as fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';

/**
 * execute command on file
 * @param commandName command name
 * @param workspaceFolderName workspace folder name
 * @param srcFileName path relative to base URI (a workspaceFolder's URI)
 * @returns source code and resulting code
 */
export async function executeCommandOnFile(
  commandName: string,
  workspaceFolderName: string,
  srcFileName: string,
  shouldRetry = false,
) {
  const testFile = srcFileName.replace('.ts', '.copy.ts');
  const base = getWorkspaceFolderUri(workspaceFolderName);
  const srcAbsPath = path.join(base.fsPath, srcFileName);
  const testAbsPath = path.join(base.fsPath, testFile);
  // 复制文件
  fs.copyFileSync(srcAbsPath, testAbsPath);
  // 打开文件
  const doc = await vscode.workspace.openTextDocument(testAbsPath);
  // 执行之前获取文件内容
  const text = doc.getText();

  try {
    setActiveWorkspaceByName(workspaceFolderName, testFile);
  } catch (error) {
    console.log(error);
    throw error;
  }
  console.time(testFile);
  await vscode.commands.executeCommand(commandName);
  // 需要些时间执行命令
  await sleep(250);
  let actual = doc.getText();

  if (shouldRetry) {
    for (let i = 0; i < 10; i++) {
      if (text !== actual) {
        break;
      }
      await vscode.commands.executeCommand(commandName);
      await sleep(250);
      actual = doc.getText();
    }
  }

  console.timeEnd(testFile);
  const fileExists = fs.existsSync(testAbsPath);
  if (fileExists) {
    console.log(`File exists: ${fileExists}`);
    // 删除测试文件
    try {
      fs.unlinkSync(testAbsPath);
      console.log('File deleted successfully');
    } catch (error) {
      console.log('Error deleting file:', error);
    }
  }

  return { actual, source: text };
}

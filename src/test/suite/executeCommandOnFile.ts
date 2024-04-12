import * as fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';

import { sleep } from '@/utils/utils';
import { getWorkspaceFolderByName, setActiveWorkspaceByName } from '@/utils/vscode-utils';

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
  // 设置一个环境变量 WORKSPACE_FOLDER_NAME
  process.env.WORKSPACE_FOLDER_NAME = workspaceFolderName;
  console.log(
    '🚀 ~ file: executeCommandOnFile.ts:22 ~ process.env.WORKSPACE_FOLDER_NAME:',
    process.env.WORKSPACE_FOLDER_NAME,
  );

  const ext = path.extname(srcFileName);
  const testFile = srcFileName.replace(ext, `.copy${ext}`);
  const workspace = getWorkspaceFolderByName(workspaceFolderName);
  const srcAbsPath = path.join(workspace?.uri?.fsPath, srcFileName);
  const testAbsPath = path.join(workspace?.uri?.fsPath, testFile);

  // 复制文件
  fs.copyFileSync(srcAbsPath, testAbsPath);
  // 打开文件
  setActiveWorkspaceByName(workspaceFolderName, srcFileName);
  const doc = await vscode.workspace.openTextDocument(testAbsPath);
  await vscode.window.showTextDocument(doc);
  // 执行之前获取文件内容
  const text = doc.getText();

  try {
    console.time(testFile);
    const result = await executeCommandWithRetry(commandName, doc, text, shouldRetry);
    console.timeEnd(testFile);
    return result;
  } catch (error) {
    console.error('Error executing command:', error);
    throw error;
  } finally {
    if (fs.existsSync(testAbsPath)) {
      fs.unlink(testAbsPath, (error) => {
        if (error) {
          console.error('Error deleting file:', error);
        } else {
          console.log(`File [${testFile}] deleted successfully`);
        }
      });
    }
  }
}

async function executeCommandWithRetry(
  commandName: string,
  doc: vscode.TextDocument,
  originalText: string,
  shouldRetry: boolean,
) {
  let actual = '';
  let retryCount = 0;

  do {
    await vscode.commands.executeCommand(commandName);
    await sleep(250);
    actual = doc.getText();
    retryCount++;
  } while (shouldRetry && originalText === actual && retryCount < 10);

  return { actual: doc.getText(), source: originalText };
}

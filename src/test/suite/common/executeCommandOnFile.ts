import * as fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';

import { sleep } from '@/utils/utils';
import { getWorkspaceFolderUriByName, setActiveWorkspaceByName } from '@/utils/vscode-utils';

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
  const ext = path.extname(srcFileName);
  const testFile = srcFileName.replace(ext, `.copy${ext}`);
  const workspace = getWorkspaceFolderUriByName(workspaceFolderName);
  const srcAbsPath = path.join(workspace.fsPath, srcFileName);
  const testAbsPath = path.join(workspace.fsPath, testFile);

  // 复制文件
  fs.copyFileSync(srcAbsPath, testAbsPath);
  // 打开文件
  setActiveWorkspaceByName(workspaceFolderName, srcFileName);
  const doc = await vscode.workspace.openTextDocument(testAbsPath);
  await vscode.window.showTextDocument(doc);
  // 执行之前获取文件内容
  const originText = doc.getText();

  try {
    console.time(testFile);
    const result = await executeCommandWithRetry({
      commandName,
      workspaceFolderName,
      doc,
      originText,
      shouldRetry,
    });
    console.timeEnd(testFile);
    return result;
  } catch (error) {
    console.error('Error executing command:', error);
    throw error;
  }
}

async function executeCommandWithRetry(options: {
  commandName: string;
  workspaceFolderName: string;
  doc: vscode.TextDocument;
  originText: string;
  shouldRetry: boolean;
}) {
  const { commandName, workspaceFolderName, doc, originText: originalText, shouldRetry } = options;
  let actual = '';
  let retryCount = 0;

  do {
    await vscode.commands.executeCommand(commandName, { workspaceFolderName });
    await sleep(250);
    actual = doc.getText();
    retryCount++;
  } while (shouldRetry && originalText === actual && retryCount < 10);

  return { actual: doc.getText(), source: originalText };
}

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
  console.log(vscode.workspace.workspaceFolders);
  const ext = path.extname(srcFileName);
  const testFile = srcFileName.replace(ext, `.copy${ext}`);
  const base = getWorkspaceFolderUri(workspaceFolderName);
  const srcAbsPath = path.join(base.fsPath, srcFileName);
  const testAbsPath = path.join(base.fsPath, testFile);
  // 复制文件
  fs.copyFileSync(srcAbsPath, testAbsPath);
  // 打开文件
  const doc = await vscode.workspace.openTextDocument(testAbsPath);
  await vscode.window.showTextDocument(doc);
  // 执行之前获取文件内容
  const text = doc.getText();

  try {
    setActiveWorkspaceByName(workspaceFolderName, testFile);
    console.time(testFile);
    await executeCommandWithRetry(commandName, doc, text, shouldRetry);
    console.timeEnd(testFile);
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

  return { actual: doc.getText(), source: text };
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
}

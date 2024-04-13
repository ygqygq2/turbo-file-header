import * as fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';

import { sleep } from '@/utils/utils';
import { getWorkspaceFolderUriByName } from '@/utils/vscode-utils';

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
  cursorLine: number,
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
  const doc = await vscode.workspace.openTextDocument(testAbsPath);
  await vscode.window.showTextDocument(doc);
  // 定位光标行，行从 0 开始
  if (cursorLine > 0) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editor.selection = new vscode.Selection(cursorLine, 0, cursorLine, 0);
    }
  }
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
    // 需要等待一段时间才能获取到结果，而且性能低的时候需要更长时间
    await sleep(1000);
    actual = doc.getText();
    retryCount++;
  } while (shouldRetry && originalText === actual && retryCount < 10);

  return { actual: doc.getText(), source: originalText };
}

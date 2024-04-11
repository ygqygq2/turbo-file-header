// import { sleep } from '@/utils/utils';
import { getWorkspaceFolderUri } from '@/utils/vscode-utils';
import path from 'path';
import * as vscode from 'vscode';

/**
 * execute command on file
 * @param commandName command name
 * @param workspaceFolderName workspace folder name
 * @param testFile path relative to base URI (a workspaceFolder's URI)
 * @returns source code and resulting code
 */
export async function executeCommandOnFile(
  commandName: string,
  workspaceFolderName: string,
  testFile: string,
  shouldRetry = false,
) {
  const base = getWorkspaceFolderUri(workspaceFolderName);
  const absPath = path.join(base.fsPath, testFile);
  const doc = await vscode.workspace.openTextDocument(absPath);
  const text = doc.getText();
  try {
    await vscode.window.showTextDocument(doc);
  } catch (error) {
    console.log(error);
    throw error;
  }
  console.time(testFile);
  await vscode.commands.executeCommand(commandName);

  let actual = doc.getText();

  if (shouldRetry) {
    for (let i = 0; i < 10; i++) {
      if (text !== actual) {
        break;
      }
      // await sleep(250);
      await vscode.commands.executeCommand(commandName);
      actual = doc.getText();
    }
  }

  console.timeEnd(testFile);

  return { actual, source: text };
}

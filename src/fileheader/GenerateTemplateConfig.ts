import vscode, { Uri } from 'vscode';
import * as fs from 'fs';
import path from 'path';
import { CUSTOM_CONFIG_FILE_NAME } from '../constants';
import { CustomError } from '@/error/ErrorHandler';
import { ErrorCode, errorCodeMessages } from '@/error/ErrorCodeMessage.enum';
import { errorHandler } from '@/extension';

export class GenerateTemplateConfig {
  private static instance: GenerateTemplateConfig;
  private constructor() {}

  public static getInstance(): GenerateTemplateConfig {
    return GenerateTemplateConfig.instance || new GenerateTemplateConfig();
  }

  public async createCustomTemplate(context: vscode.ExtensionContext) {
    const workspaces = vscode.workspace.workspaceFolders;
    if (!workspaces) {
      errorHandler.handle(
        new CustomError(
          ErrorCode.WorkspaceFolderNotFound,
          errorCodeMessages[ErrorCode.WorkspaceFolderNotFound],
        ),
      );
      return;
    }

    const activeDocumentUri = vscode.window.activeTextEditor?.document.uri;
    let targetWorkspace: vscode.WorkspaceFolder | undefined = undefined;
    if (activeDocumentUri) {
      targetWorkspace = vscode.workspace.getWorkspaceFolder(activeDocumentUri);
    } else {
      const picked = await vscode.window.showQuickPick(
        workspaces.map((workspace) => ({ label: workspace.name, workspace })),
        { title: 'Select which workspace for add custom fileheader template' },
      );

      targetWorkspace = picked?.workspace;
    }

    if (!targetWorkspace) {
      return;
    }

    const uri = (Uri as any).joinPath(context.extensionUri, 'resources', CUSTOM_CONFIG_FILE_NAME);
    const configDir = path.join(targetWorkspace.uri.fsPath, '.vscode');
    const configPath = path.join(configDir, CUSTOM_CONFIG_FILE_NAME);

    try {
      // 确保目标目录存在
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      if (!fs.existsSync(configPath)) {
        // 读取fileheader.config.yaml文件内容
        const content = fs.readFileSync(uri.path, 'utf8');
        // 将文件内容写入目标文件
        fs.writeFileSync(configPath, content);
      }

      // 打开新创建的文件
      const document = await vscode.workspace.openTextDocument(configPath);
      vscode.window.showTextDocument(document);
    } catch (error) {
      errorHandler.handle(new CustomError(ErrorCode.GitGetCtimeFail, error));
    }

    const document = await vscode.workspace.openTextDocument(path.resolve(configPath));

    vscode.window.showTextDocument(document);
  }
}

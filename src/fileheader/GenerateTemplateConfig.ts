import vscode, { Uri } from 'vscode';
import * as fs from 'fs';
import path from 'path';
import { CUSTOM_CONFIG_FILE_NAME } from '../constants';
import { CustomError } from '@/error/ErrorHandler';
import { ErrorCode, errorCodeMessages } from '@/error/ErrorCodeMessage.enum';
import { errorHandler } from '@/extension';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';

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

    const targetWorkspace = await getActiveDocumentWorkspace();

    if (!targetWorkspace) {
      return;
    }

    const uri = (Uri as any).joinPath(context.extensionUri, 'resources', CUSTOM_CONFIG_FILE_NAME);
    const configDir = path.join(targetWorkspace.uri.fsPath, '.vscode');
    const configPath = path.join(configDir, CUSTOM_CONFIG_FILE_NAME);

    try {
      // 确保目标目录存在
      if (!fs.existsSync(configDir)) {
        try {
          fs.mkdirSync(configDir, { recursive: true });
        } catch (error) {
          errorHandler.handle(new CustomError(ErrorCode.CreateDirFail, configDir, error));
        }
      }

      if (!fs.existsSync(configPath)) {
        try {
          // 读取fileheader.config.yaml文件内容
          const content = fs.readFileSync(uri.path, 'utf8');
          // 将文件内容写入目标文件
          fs.writeFileSync(configPath, content);
        } catch (error) {
          errorHandler.handle(new CustomError(ErrorCode.CreateFileFail, configPath, error));
        }
      }

      // 打开新创建的文件
      const document = await vscode.workspace.openTextDocument(configPath);
      vscode.window.showTextDocument(document);
    } catch (error) {
      errorHandler.handle(new CustomError(ErrorCode.GenerateTemplateConfigFail, error));
    }

    const document = await vscode.workspace.openTextDocument(path.resolve(configPath));

    vscode.window.showTextDocument(document);
  }
}

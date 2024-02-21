import vscode from 'vscode';
import * as fs from 'fs';
import path from 'path';
import { evaluateTemplate, getTaggedTemplateInputs } from '../utils/utils';
import { IFileheaderVariables, ITemplateFunction, Template } from '../typings/types';
import {
  CUSTOM_TEMPLATE_FILE_NAME,
  TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER,
  TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER,
  WILDCARD_ACCESS_VARIABLES,
} from '../constants';
import { CustomError } from '@/error/ErrorHandler';
import { ErrorCode, errorCodeMessages } from '@/error/ErrorCodeMessage.enum';
import { errorHandler } from '@/extension';

export abstract class FileheaderLanguageProvider {
  // 自定义 fileheader.config.yaml 模板
  private static customTemplatePath: string = path.resolve(__dirname, 'fileheader.config.yaml');

  public static async createCustomTemplate() {
    const customTemplatePath = FileheaderLanguageProvider.customTemplatePath;
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

    const templateDir = path.join(targetWorkspace.uri.fsPath, '.vscode');
    const templatePath = path.join(templateDir, CUSTOM_TEMPLATE_FILE_NAME);

    try {
      // 读取fileheader.config.yaml文件内容
      const content = fs.readFileSync(customTemplatePath, 'utf8');

      // 确保目标目录存在
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
      }

      if (!fs.existsSync(templatePath)) {
        // 将文件内容写入目标文件
        fs.writeFileSync(templatePath, content);
      }

      // 打开新创建的文件
      const document = await vscode.workspace.openTextDocument(templatePath);
      vscode.window.showTextDocument(document);
    } catch (error) {
      errorHandler.handle(new CustomError(ErrorCode.GitGetCtimeFail, error));
    }

    const document = await vscode.workspace.openTextDocument(path.resolve(templatePath));

    vscode.window.showTextDocument(document);
  }
  /**
   *
   * @param workspaceScopeUri the custom loader workspace folder uri
   */
  constructor(public readonly workspaceScopeUri?: vscode.Uri) {
    this.calculateVariableAccessInfo();
  }

  public get isCustomProvider() {
    return !!this.workspaceScopeUri;
  }

  abstract readonly languages: string[];

  readonly startLineOffset = 0;

  abstract blockCommentStart: string;
  abstract blockCommentEnd: string;

  protected abstract getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables): Template;

  private getTemplateInternal(variables: IFileheaderVariables) {
    return this.getTemplate(getTaggedTemplateInputs, variables);
  }

  public getFileheader(variables: IFileheaderVariables): string {
    const { strings: _strings, interpolations } = this.getTemplateInternal(variables);
    const strings = Array.from(_strings);

    return evaluateTemplate(strings, interpolations);
  }

  public getOriginFileheaderRegExp(eol: vscode.EndOfLine): RegExp {
    const template = this.getTemplateInternal(WILDCARD_ACCESS_VARIABLES as IFileheaderVariables);

    const templateValue = evaluateTemplate(template.strings, template.interpolations, true);
    const pattern = templateValue
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      // user custom template may have `\r\n`, for example, read a file in Windows.
      // We should normalize it to `\n`
      .replace(/\r\n/g, '\n')
      .replace(new RegExp(`${TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER.start}`, 'g'), '(?:')
      .replace(new RegExp(`${TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER.end}`, 'g'), ')?')
      .replace(
        new RegExp(
          `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_(\\w+)_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
          'g',
        ),
        '(?<$1>.*)',
      )
      .replace(/\n/g, eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n');

    return new RegExp(pattern, 'm');
  }

  public getSourcefileWithoutFileheader(document: vscode.TextDocument): string {
    const regexp = new RegExp(this.getOriginFileheaderRegExp(document.eol), 'mg');
    const source = document.getText();
    return source.replace(regexp, '');
  }

  public readonly accessVariableFields = new Set<keyof IFileheaderVariables>();
  private calculateVariableAccessInfo() {
    const addVariableAccess = (p: string) =>
      this.accessVariableFields.add(p as keyof IFileheaderVariables);

    const proxyVariables = new Proxy(WILDCARD_ACCESS_VARIABLES, {
      get(target, p, _receiver) {
        addVariableAccess(p as string);
        return Reflect.get(target, p);
      },
    });

    this.getTemplateInternal(proxyVariables);
  }
}

import vscode from 'vscode';
import output from '@/error/output';
import { hasShebang } from '../utils/utils';
import { FileheaderVariableBuilder } from './FileheaderVariableBuilder';
import { FileHashMemento } from './FileHashMemento';
import { vscProvider } from '../vsc-provider';
import { CustomError } from '@/error/ErrorHandler';
import { ErrorCode, errorCodeMessages } from '@/error/ErrorCodeMessage.enum';
import { FileheaderProviderLoader } from './FileheaderProviderLoader';
import { errorHandler } from '@/extension';
import { LanguageProvider } from '@/language-providers';
import { VscodeInternalProvider } from '@/language-providers/VscodeInternalProvider';
import { IFileheaderVariables } from '../typings/types';
import { ConfigManager } from '@/configuration/ConfigManager';
import { Configuration } from '@/configuration/types';
import { isLineStartOrEnd } from '@/utils/vscode-utils';

type UpdateFileheaderManagerOptions = {
  silent?: boolean;
  allowInsert?: boolean;
};

type OriginFileheaderInfo = {
  range: vscode.Range;
  variables?: IFileheaderVariables | undefined;
};

export class FileheaderManager {
  private configManager: ConfigManager;
  private providers: LanguageProvider[] = [];
  private fileheaderProviderLoader: FileheaderProviderLoader;
  private fileHashMemento: FileHashMemento;
  private fileheaderVariableBuilder: FileheaderVariableBuilder;

  constructor(
    configManager: ConfigManager,
    fileheaderProviderLoader: FileheaderProviderLoader,
    fileHashMemento: FileHashMemento,
    fileheaderVariableBuilder: FileheaderVariableBuilder,
  ) {
    this.configManager = configManager;
    this.fileheaderProviderLoader = fileheaderProviderLoader;
    this.fileHashMemento = fileHashMemento;
    this.fileheaderVariableBuilder = fileheaderVariableBuilder;
  }

  public async loadProviders(forceRefresh = false) {
    this.providers = await this.fileheaderProviderLoader.loadProviders(forceRefresh);
  }

  private async findProvider(document: vscode.TextDocument) {
    const languageId = document.languageId;
    for (const provider of this.providers) {
      // 只有自定义 provider 有 provider.workspaceScopeUri
      let isWorkspaceMatch: boolean;
      if (!provider.workspaceScopeUri) {
        isWorkspaceMatch = true;
      } else {
        const documentWorkspace = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.path;
        const providerWorkspace = provider.workspaceScopeUri?.path;
        isWorkspaceMatch = documentWorkspace === providerWorkspace;
      }
      if (!isWorkspaceMatch) {
        continue;
      }

      const isLanguageMatch = await (async () => {
        if (provider.languages.length === 0 && provider instanceof VscodeInternalProvider) {
          await provider.getBlockCommentFromVscode(languageId);
          return true;
        }
        return provider.languages.includes(languageId);
      })();

      if (isLanguageMatch) {
        return provider;
      }
    }
    output.info(new CustomError(ErrorCode.LanguageProviderNotFound));
  }

  private getOriginFileheaderInfo(document: vscode.TextDocument, provider: LanguageProvider) {
    const range = provider.getOriginFileheaderRange(document);

    const pattern = provider.getOriginFileheaderRegExp(document.eol);
    const info: {
      range: vscode.Range;
      variables?: IFileheaderVariables;
    } = {
      range,
      variables: undefined,
    };

    const content = document.getText(range);
    const result = content.match(pattern);
    if (result) {
      info.variables = result.groups;
    }
    return info;
  }

  private async shouldSkipReplace(
    config: Configuration & vscode.WorkspaceConfiguration,
    document: vscode.TextDocument,
  ) {
    // 只支持脏文档时，如果当前文档不是脏文档，则标记跳过
    if (config.updateHeaderForModifiedFilesOnly && !document.isDirty) {
      return true;
    }

    // if there is a change in VCS provider, we should replace the fileheader
    const isTracked = await vscProvider.isTracked(document.fileName);
    const hasChanged = isTracked ? await vscProvider.hasChanged(document.fileName) : false;

    return isTracked && !hasChanged && this.fileHashMemento.has(document);
  }

  private async processFileheaderInsertionOrReplacement(
    document: vscode.TextDocument,
    provider: LanguageProvider,
    originFileheaderInfo: OriginFileheaderInfo,
    fileheaderVariable: IFileheaderVariables,
    config: Configuration & vscode.WorkspaceConfiguration,
    allowInsert: boolean,
    _silent: boolean,
  ) {
    const editor = await vscode.window.showTextDocument(document);
    const fileheader = provider.generateFileheader(fileheaderVariable);
    const startLine = provider.startLineOffset + (hasShebang(document.getText()) ? 1 : 0);
    const { range } = originFileheaderInfo;
    const content = document.getText(range);
    // const originContent = provider.getSourceFileWithoutFileheader(document);

    const shouldSkipReplace =
      // 不允许插入，且范围开始和结束相同（没有文件头的空间）
      (!allowInsert && range.start.isEqual(range.end)) ||
      // 范围开始和结束不相同（有文件头），且文件头内容相同，或者根据设置判断是否应该跳过更新
      (!range.start.isEqual(range.end) &&
        (content?.replace(/\r\n/g, '\n') === fileheader ||
          (await this.shouldSkipReplace(config, document))));

    if (shouldSkipReplace) {
      return;
    }

    // 确保文件头信息后只有一行空行
    const endIsLinePosition = isLineStartOrEnd(document, range);
    let lineAfterHeader = endIsLinePosition === 0 ? range.end.line : range.end.line + 1;
    while (
      lineAfterHeader < document.lineCount &&
      document.lineAt(lineAfterHeader).isEmptyOrWhitespace
    ) {
      lineAfterHeader++;
    }

    // 哪个位置在前面，则为替换开始位置
    const start = range.start.line;
    const replaceStartLine = start >= startLine ? startLine : start;
    // 当文件头信息开始位置在后面些时，则使用空行补上，以达到文件头往后移的效果
    const emptyLines = '\n'.repeat(startLine - start);
    const replaceFileheader = start <= startLine ? emptyLines + fileheader : fileheader;

    // 原来有文件头（文件开头的注释都当作文件头信息）
    // 原来没有文件头
    // 都可以用 replace
    const rangeToReplace = new vscode.Range(
      document.lineAt(replaceStartLine).range.start,
      document.lineAt(lineAfterHeader).range.start,
    );
    await editor.edit((editBuilder) => {
      editBuilder.replace(rangeToReplace, replaceFileheader + '\n\n');
    });

    await document.save();
  }

  public async updateFileheader(
    document: vscode.TextDocument,
    { allowInsert = true, silent = false }: UpdateFileheaderManagerOptions = {},
  ) {
    const config = this.configManager.getConfiguration();
    const languageId = document?.languageId;
    const provider = await this.findProvider(document);
    if (provider instanceof VscodeInternalProvider) {
      await provider.getBlockCommentFromVscode(languageId);
    }

    if (!provider) {
      !silent &&
        !allowInsert &&
        errorHandler.handle(
          new CustomError(
            ErrorCode.LanguageNotSupport,
            errorCodeMessages[ErrorCode.LanguageNotSupport],
          ),
        );
      return;
    }

    const originFileheaderInfo = this.getOriginFileheaderInfo(document, provider);
    let fileheaderVariable: IFileheaderVariables;
    try {
      fileheaderVariable = await this.fileheaderVariableBuilder?.build(
        config,
        document.uri,
        provider,
        originFileheaderInfo.variables,
      );
    } catch (error) {
      !silent && errorHandler.handle(new CustomError(ErrorCode.VariableBuilderFail, error));
      return;
    }

    this.processFileheaderInsertionOrReplacement(
      document,
      provider,
      originFileheaderInfo,
      fileheaderVariable,
      config,
      allowInsert,
      silent,
    );

    this.fileHashMemento.set(document);
  }

  public recordOriginFileHash(documents: readonly vscode.TextDocument[]) {
    for (const document of documents) {
      this.fileHashMemento.set(document);
    }
  }
}

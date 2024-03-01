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

type UpdateFileheaderManagerOptions = {
  silent?: boolean;
  allowInsert?: boolean;
};

type OriginFileheaderInfo = {
  start: number;
  end: number;
  content?: string | undefined;
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
    const source = document.getText();
    const pattern = provider.getOriginFileheaderRegExp(document.eol);
    const range: {
      start: number;
      end: number;
      content?: string;
      variables?: IFileheaderVariables;
    } = {
      start: -1,
      end: -1,
      content: undefined,
      variables: undefined,
    };
    const result = source.match(pattern);
    if (result) {
      const match = result[0];
      range.content = match;
      range.start = result.index!;
      range.variables = result.groups;
      range.end = range.start + match.length;
    }
    return range;
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
    const hasChanged = isTracked && (await vscProvider.hasChanged(document.fileName));

    return !hasChanged && this.fileHashMemento.has(document);
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

    const shouldSkipReplace =
      originFileheaderInfo.start !== -1 &&
      (originFileheaderInfo.content?.replace(/\r\n/g, '\n') === fileheader ||
        (await this.shouldSkipReplace(config, document)));

    if (shouldSkipReplace) {
      return;
    }

    // 替换文件头信息
    const originStart = document.positionAt(originFileheaderInfo.start);
    const originEnd = document.positionAt(originFileheaderInfo.end);
    const newStart = new vscode.Position(startLine, 0);
    const newFileHeaderLines = fileheader.split('\n').length - 1;
    if (originFileheaderInfo.start !== -1) {
      await editor.edit((editBuilder) => {
        editBuilder.replace(new vscode.Range(newStart, originEnd), fileheader);
      });

      // 更新起始位置和结束位置
      originFileheaderInfo.start = document.offsetAt(newStart);
      originFileheaderInfo.end = document.offsetAt(newStart.translate(newFileHeaderLines, 0));
    } else if (allowInsert) {
      const onlyHasSingleLine = document.lineCount === 1;
      const isLeadingLineEmpty = document.lineAt(startLine).isEmptyOrWhitespace;
      const shouldInsertLineBreak = !isLeadingLineEmpty || onlyHasSingleLine;
      const value = shouldInsertLineBreak ? fileheader + '\n' : fileheader;
      await editor.edit((editBuilder) => {
        editBuilder.insert(newStart, value);
      });
    }

    await document.save();
    // 确保文件头信息后只有一行空行
    await this.ensureSingleLineSpacingAfterHeader(document, editor, originFileheaderInfo);
  }

  private async ensureSingleLineSpacingAfterHeader(
    document: vscode.TextDocument,
    editor: vscode.TextEditor,
    originFileheaderInfo: OriginFileheaderInfo,
  ) {
    const endLineOfHeader = document.positionAt(originFileheaderInfo.end).line;
    const nextLine = endLineOfHeader + 1;
    const secondNextLine = endLineOfHeader + 2;

    // 检查文件头信息后的行是否超过文档总行数
    if (document.lineCount <= nextLine) {
      // 如果文件只有文件头信息，确保在文件末尾添加一个空行
      await editor.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(endLineOfHeader + 1, 0), '\n');
      });
    } else if (
      document.lineCount > secondNextLine &&
      document.lineAt(secondNextLine).isEmptyOrWhitespace
    ) {
      // 如果文件头信息后有多于一个的空行，删除多余的空行
      await editor.edit((editBuilder) => {
        for (
          let i = secondNextLine;
          i < document.lineCount && document.lineAt(i).isEmptyOrWhitespace;
          i++
        ) {
          editBuilder.delete(document.lineAt(i).rangeIncludingLineBreak);
        }
      });
    }
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

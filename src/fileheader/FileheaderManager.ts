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
    // 获取文档的全部文本
    let source = document.getText();
    // 检查并获取起始行，如果有shebang则为1，否则为0
    const startLine = hasShebang(source) ? 1 : 0;
    // 如果有shebang，从文档文本中移除shebang行
    if (startLine === 1) {
      // 分割文本为行，移除第一行（shebang），然后再次拼接
      source = source.split(/\r?\n/).slice(1).join('\n');
    }
    const pattern = provider.getOriginFileheaderRegExp(document.eol);
    // const sourceContent = provider.getSourceFileWithoutFileheader(document);
    // console.log('🚀 ~ file: FileheaderManager.ts:95 ~ sourceContent:', sourceContent);
    const range: {
      start: number;
      end: number;
      content?: string;
      variables?: IFileheaderVariables;
    } = {
      start: startLine, // 这里的startLine应保持原值，代表原始文档中注释的起始位置
      end: startLine, // 初始结束行同为startLine，后续根据匹配结果调整
      content: undefined,
      variables: undefined,
    };
    const result = source.match(pattern);
    console.log('🚀 ~ file: FileheaderManager.ts:109 ~ result:', result);
    if (result) {
      const match = result[0];
      range.content = match;
      range.start = result.index! + startLine; // 调整start，加上shebang行的可能存在
      range.variables = result.groups;
      range.end = range.start + match.split(/\r?\n/).length - 1; // 计算结束行，考虑到多行注释的情况
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

    // 没有文件头，又不允许插入，直接返回
    const shouldSkipReplace =
      (!allowInsert && originFileheaderInfo.start === originFileheaderInfo.end) ||
      // 有文件头，但文件头内容相同，或者根据设置判断是否应该跳过更新
      (originFileheaderInfo.start !== originFileheaderInfo.end &&
        (originFileheaderInfo.content?.replace(/\r\n/g, '\n') === fileheader ||
          (await this.shouldSkipReplace(config, document))));

    if (shouldSkipReplace) {
      return;
    }

    // 确保文件头信息后只有一行空行
    let lineAfterHeader = originFileheaderInfo.end + 1;
    while (
      lineAfterHeader < document.lineCount &&
      document.lineAt(lineAfterHeader).isEmptyOrWhitespace
    ) {
      lineAfterHeader++;
    }

    // 哪个位置在前面，则为替换开始位置
    const replaceStart =
      originFileheaderInfo.start >= startLine ? startLine : originFileheaderInfo.start;
    const newStart = new vscode.Position(replaceStart, 0);
    // 当文件头信息开始位置在后面些时，则使用空行补上，以达到文件头往后移的效果
    const emptyLines = '\n'.repeat(startLine - originFileheaderInfo.start);
    const replaceFileheader =
      originFileheaderInfo.start <= startLine ? emptyLines + fileheader : fileheader;

    // 原来有文件头（文件开头的注释都当作文件头信息）
    // 原来没有文件头
    // 都可以用 replace
    const rangeToReplace = new vscode.Range(
      newStart,
      document.lineAt(lineAfterHeader - 1).range.end,
    );
    await editor.edit((editBuilder) => {
      editBuilder.replace(rangeToReplace, replaceFileheader + '\n');
    });

    // 将文件头开始及往后的内容移到 startLine 行开始，如果往后移动，则前面用空行补齐

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
    console.log(
      '🚀 ~ file: FileheaderManager.ts:220 ~ originFileheaderInfo:',
      originFileheaderInfo,
    );

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

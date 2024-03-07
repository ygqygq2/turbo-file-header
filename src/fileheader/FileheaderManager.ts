import vscode from 'vscode';
import output from '@/error/output';
import { errorHandler } from '@/extension';
import { convertDateFormatToRegex, hasShebang } from '@/utils/utils';
import { isLineStartOrEnd } from '@/utils/vscode-utils';
import { FileheaderVariableBuilder } from './FileheaderVariableBuilder';
import { FileHashMemento } from './FileHashMemento';
import { CustomError } from '@/error/ErrorHandler';
import { ErrorCode, errorCodeMessages } from '@/error/ErrorCodeMessage.enum';
import { FileheaderProviderLoader } from './FileheaderProviderLoader';
import { LanguageProvider } from '@/language-providers';
import { VscodeInternalProvider } from '@/language-providers/VscodeInternalProvider';
import { ConfigYaml, IFileheaderVariables } from '../typings/types';
import { ConfigManager } from '@/configuration/ConfigManager';
import { Configuration } from '@/configuration/types';
import { ConfigSection } from '@/constants';
import { BaseVCSProvider } from '@/vsc-provider/BaseVCSProvider';
import { FileMatcher } from '@/extension-operate/FileMatcher';

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
  private vscProvider: BaseVCSProvider;
  private providers: LanguageProvider[] = [];
  private fileheaderProviderLoader: FileheaderProviderLoader;
  private fileHashMemento: FileHashMemento;
  private fileheaderVariableBuilder: FileheaderVariableBuilder;

  constructor(
    configManager: ConfigManager,
    vscProvider: BaseVCSProvider,
    fileheaderProviderLoader: FileheaderProviderLoader,
    fileHashMemento: FileHashMemento,
    fileheaderVariableBuilder: FileheaderVariableBuilder,
  ) {
    this.configManager = configManager;
    this.vscProvider = vscProvider;
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
    const isTracked = await this.vscProvider.isTracked(document.fileName);
    const hasChanged = isTracked ? await this.vscProvider.hasChanged(document.fileName) : false;

    return isTracked && !hasChanged && this.fileHashMemento.has(document);
  }

  private removeDateString(fileHeaderContent: string, regex: RegExp): string {
    // 将匹配到的时间行替换为空字符串
    return fileHeaderContent.replace(regex, '');
  }

  private async shouldSkipReplacement(
    document: vscode.TextDocument,
    fileheaderRange: vscode.Range,
    newFileheader: string,
    config: Configuration & vscode.WorkspaceConfiguration,
    allowInsert: boolean,
  ) {
    const originContent = document.getText(fileheaderRange)?.replace(/\r\n/g, '\n');
    const originContentLineCount = originContent.split('\n').length;
    const dateformat = config.get(ConfigSection.dateFormat, 'YYYY-MM-DD HH:mm:ss');
    const dateRegex = new RegExp(convertDateFormatToRegex(dateformat), 'g');

    // 避免 prettier 这类格式后处理空格，导致文件头内容变化影响判断
    let contentSame: boolean = false;
    if (originContentLineCount > 1) {
      let originContentLines = originContent.split('\n').map((line) => line.trim());
      if (
        originContentLineCount > 3 &&
        !originContentLines[0].match(/[a-zA-Z0-9]/) &&
        !originContentLines[originContentLines.length - 1].match(/[a-zA-Z0-9]/)
      ) {
        originContentLines = originContentLines.slice(1, -1);
      }
      const originContentProcessed = this.removeDateString(
        originContentLines.join('\n'),
        dateRegex,
      );

      let newFileheaderLines = newFileheader.split('\n').map((line) => line.trim());
      if (
        newFileheaderLines.length > 3 &&
        !newFileheaderLines[0].match(/[a-zA-Z0-9]/) &&
        !newFileheaderLines[newFileheaderLines.length - 1].match(/[a-zA-Z0-9]/)
      ) {
        newFileheaderLines = newFileheaderLines.slice(1, -1);
      }
      const newFileheaderProcessed = this.removeDateString(
        newFileheaderLines.join('\n'),
        dateRegex,
      );

      contentSame = originContentProcessed === newFileheaderProcessed;
    } else {
      const originContentProcessed = this.removeDateString(originContent, dateRegex);
      const newFileheaderProcessed = this.removeDateString(newFileheader, dateRegex);
      contentSame = originContentProcessed === newFileheaderProcessed;
    }

    // 不允许插入，且范围开始和结束相同（没有文件头的空间）
    return (
      (!allowInsert && fileheaderRange.start.isEqual(fileheaderRange.end)) ||
      // 范围开始和结束不相同（有文件头），且文件头内容相同，或者根据设置判断是否应该跳过更新
      (!fileheaderRange.start.isEqual(fileheaderRange.end) &&
        (contentSame || (await this.shouldSkipReplace(config, document))))
    );
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
    const { useJSDocStyle } = config;
    const isJsTs = provider.languages.some((lang) =>
      ['typescript', 'javascript', 'javascriptreact', 'typescriptreact'].includes(lang),
    );
    const useJSDocStyleParam = isJsTs && useJSDocStyle;
    const fileheader = provider.generateFileheader(fileheaderVariable, useJSDocStyleParam);
    const startLine = provider.startLineOffset + (hasShebang(document.getText()) ? 1 : 0);
    const { range } = originFileheaderInfo;

    const shouldSkipReplace = await this.shouldSkipReplacement(
      document,
      range,
      fileheader,
      config,
      allowInsert,
    );
    if (shouldSkipReplace) {
      return;
    }

    // 确保文件头信息后只有一行空行
    const endIsLinePosition = isLineStartOrEnd(document, range);
    let lineAfterHeader = endIsLinePosition === 0 ? range.end.line : range.end.line + 1;
    while (
      lineAfterHeader < document.lineCount - 1 &&
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
    // console.log("🚀 ~ file: FileheaderManager.ts:243 ~ allowInsert:", allowInsert);
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

  public async batchUpdateFileheader(fileMatcherClass: new (config: ConfigYaml) => FileMatcher) {
    const config = await this.configManager.getConfigurationFromCustomConfig();
    if (!config || !config.findFilesConfig) {
      return;
    }
    const findFilesConfig = config?.findFilesConfig || {
      include: '**/tmp/*.{ts,js}',
      exclude: '**/{node_modules,dist}/**',
    };
    const fileMatcher = new fileMatcherClass(findFilesConfig);
    const files = await fileMatcher.findFiles();

    for (const file of files) {
      try {
        const document = await vscode.workspace.openTextDocument(file);
        await this.updateFileheader(document);
        await document.save();
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      } catch (error) {
        errorHandler.handle(new CustomError(ErrorCode.CreateFileFail, file.path, error));
      }
    }
  }
}

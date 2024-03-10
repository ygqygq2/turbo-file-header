import vscode from 'vscode';
import output from '@/error/output';
import path from 'path';
import fs from 'fs';
import { initVCSProvider } from '@/init';
import { errorHandler } from '@/extension';
import { convertDateFormatToRegex, hasShebang } from '@/utils/utils';
import { getActiveDocumentWorkspace, isLineStartOrEnd } from '@/utils/vscode-utils';
import { FileheaderVariableBuilder } from './FileheaderVariableBuilder';
import { FileHashMemento } from './FileHashMemento';
import { CustomError } from '@/error/ErrorHandler';
import { ErrorCode, errorCodeMessages } from '@/error/ErrorCodeMessage.enum';
import { FileheaderProviderLoader } from './FileheaderProviderLoader';
import { LanguageProvider } from '@/language-providers';
import { VscodeInternalProvider } from '@/language-providers/VscodeInternalProvider';
import { IFileheaderVariables } from '../typings/types';
import { ConfigManager } from '@/configuration/ConfigManager';
import { Configuration } from '@/configuration/types';
import { ConfigSection } from '@/constants';
import { FileMatcher } from '@/extension-operate/FileMatcher';
import { withProgress } from '@/utils/with-progress';

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
  private cachedContent: { [key: string]: string } = {};

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

  private async fileIsChanged(
    config: Configuration & vscode.WorkspaceConfiguration,
    document: vscode.TextDocument,
  ) {
    // 只支持脏文档时，如果当前文档不是脏文档，则标记跳过
    if (config.updateHeaderForModifiedFilesOnly && !document.isDirty) {
      return true;
    }

    const vcsProvider = await initVCSProvider();
    // 是否跟踪
    const isTracked = await vcsProvider.isTracked(document.fileName);
    // 是否有修改
    const isChanged = isTracked ? await vcsProvider.isChanged(document.fileName) : false;
    // 有跟踪则判断是否有修改，文件 hash 是否有记录
    // 没有跟踪则直接认为是文件有修改
    // 有 hash 记录则是有文件修改
    console.log('hash', this.fileHashMemento.has(document));
    return (isTracked && isChanged) || this.fileHashMemento.has(document);
  }

  private removeDateString(fileHeaderContent: string, regex: RegExp): string {
    // 将匹配到的时间行替换为空字符串
    return fileHeaderContent.replace(regex, '');
  }

  private async shouldUpdate(
    document: vscode.TextDocument,
    fileheaderRange: vscode.Range,
    newFileheader: string,
    config: Configuration & vscode.WorkspaceConfiguration,
    provider: LanguageProvider,
    allowInsert: boolean,
  ) {
    const originContent = document.getText(fileheaderRange)?.replace(/\r\n/g, '\n');
    const originContentLineCount = originContent.split('\n').length;
    const dateformat = config.get(ConfigSection.dateFormat, 'YYYY-MM-DD HH:mm:ss');
    const dateRegex = new RegExp(convertDateFormatToRegex(dateformat), 'g');

    const filePath = document.uri.fsPath;
    const contentWithoutHeader = provider.getSourceFileWithoutFileheader(document);
    const isContentChange = this.checkContentChange(filePath, contentWithoutHeader);

    // 避免 prettier 这类格式后处理空格，导致文件头内容变化影响判断
    let headerSame: boolean = false;
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

      headerSame = originContentProcessed === newFileheaderProcessed;
    } else {
      const originContentProcessed = this.removeDateString(originContent, dateRegex);
      const newFileheaderProcessed = this.removeDateString(newFileheader, dateRegex);
      headerSame = originContentProcessed === newFileheaderProcessed;
    }

    console.log('allowInsert', allowInsert);
    console.log(await this.fileIsChanged(config, document), isContentChange, headerSame);
    // 不允许插入，且范围开始和结束相同（没有文件头的空间）
    const noHeader = fileheaderRange.start.isEqual(fileheaderRange.end);
    const a = !allowInsert && noHeader;
    // 文件有修改，则第一次认为是有修改，缓存起来
    const fileIsChanged = await this.fileIsChanged(config, document);
    // 范围开始和结束不相同（有文件头）
    // 文件有修改且是正文，则直接返回
    const b = !noHeader && fileIsChanged && isContentChange;
    // 文件有修改，不是正文，就判断文件头是否相同
    const c = !noHeader && fileIsChanged && !isContentChange;
    if (a === false) {
      return false;
    } else {
      if (b === true) {
        return true;
      }
      if (c === true) {
        return !headerSame;
      }
      // 文件没有修改
      return false;
    }
  }

  private checkContentChange(filePath: string, newContent: string): boolean {
    if (this.cachedContent[filePath] === newContent) {
      // 文件内容未发生变化
      return false;
    } else {
      // 文件内容已经发生变化，更新缓存
      this.cachedContent[filePath] = newContent;
      return true;
    }
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

    const shouldUpdate = await this.shouldUpdate(
      document,
      range,
      fileheader,
      config,
      provider,
      allowInsert,
    );
    if (!shouldUpdate) {
      output.info('Not need update filer header:', document.uri.fsPath);
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
    output.info('File header updated:', document.uri.fsPath);
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

  public updateOriginFileHash(document: vscode.TextDocument) {
    this.fileHashMemento.set(document);
  }

  private async findFiles() {
    const activeWorkspace = await getActiveDocumentWorkspace();
    if (!activeWorkspace) {
      output.info('Please check your workspace');
      return;
    }

    const configDir = path.join(activeWorkspace.uri.fsPath, '.vscode');
    // 确保目标目录存在
    if (!fs.existsSync(configDir)) {
      try {
        fs.mkdirSync(configDir, { recursive: true });
      } catch (error) {
        errorHandler.handle(new CustomError(ErrorCode.CreateDirFail, configDir, error));
      }
    }

    const config = await this.configManager.getConfigurationFromCustomConfig();
    if (!config || !config.findFilesConfig) {
      errorHandler.handle(new CustomError(ErrorCode.GetCustomConfigFail));
      return;
    }

    const findFilesConfig = config?.findFilesConfig || {
      include: '**/tmp/*.{ts,js}',
      exclude: '**/{node_modules,dist}/**',
    };
    const fileMatcher = new FileMatcher(findFilesConfig);
    const files = await fileMatcher.findFiles();
    return files;
  }

  public async batchUpdateFileheader() {
    let failedFiles = (await this.findFiles()) || [];
    let reprocessedFiles: vscode.Uri[] = [];

    await withProgress(
      'Processing schedule',
      async () => {
        while (failedFiles.length > 0) {
          for (const file of failedFiles) {
            try {
              const document = await vscode.workspace.openTextDocument(file);
              await this.updateFileheader(document);
              await document.save();
              vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            } catch (error) {
              reprocessedFiles.push(file);
              errorHandler.handle(
                new CustomError(ErrorCode.UpdateFileHeaderFail, file.fsPath, error),
              );
            }
          }

          failedFiles = reprocessedFiles;
          reprocessedFiles = [];

          if (failedFiles.length === 0) {
            break;
          }
        }
      },
      failedFiles.length,
    );
  }
}

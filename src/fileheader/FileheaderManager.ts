import vscode from 'vscode';
import path from 'path';
import { initVCSProvider } from '@/init';
import { logger } from '@/extension';
import { CustomError, ErrorCode } from '@/error';
import { convertDateFormatToRegex, hasShebang } from '@/utils/utils';
import { addSelectionAfterString, isLineStartOrEnd } from '@/utils/vscode-utils';
import { updateProgress, withProgress } from '@/utils/with-progress';
import { removeSpecialString } from '@/utils/str';
import { FileheaderVariableBuilder } from './FileheaderVariableBuilder';
import { FileHashManager } from './FileHashManager';
import { FileheaderProviderLoader } from './FileheaderProviderLoader';
import { LanguageProvider } from '@/language-providers';
import { VscodeInternalProvider } from '@/language-providers/VscodeInternalProvider';
import { Config, IFileheaderVariables } from '../typings/types';
import { ConfigManager } from '@/configuration/ConfigManager';
import { ConfigSection } from '@/constants';
import { OriginFileheaderInfo, UpdateFileheaderManagerOptions } from './types';
import { FileheaderProviderService } from './FileheaderProviderService';
import { FileMatcher } from '@/extension-operate/FileMatcher';

export class FileheaderManager {
  private configManager: ConfigManager;
  private fileMatcher: FileMatcher;
  private providers: LanguageProvider[] = [];
  private fileheaderProviderLoader: FileheaderProviderLoader;
  private fileHashManager: FileHashManager;
  private fileheaderVariableBuilder: FileheaderVariableBuilder;
  private fileheaderProviderService: FileheaderProviderService;

  constructor(
    configManager: ConfigManager,
    fileMatcher: FileMatcher,
    fileheaderProviderLoader: FileheaderProviderLoader,
    fileHashManager: FileHashManager,
    fileheaderVariableBuilder: FileheaderVariableBuilder,
    fileheaderProviderService: FileheaderProviderService,
  ) {
    this.configManager = configManager;
    this.fileMatcher = fileMatcher;
    this.fileheaderProviderLoader = fileheaderProviderLoader;
    this.fileHashManager = fileHashManager;
    this.fileheaderVariableBuilder = fileheaderVariableBuilder;
    this.fileheaderProviderService = fileheaderProviderService;
  }

  public async loadProviders(forceRefresh = false) {
    this.providers = await this.fileheaderProviderLoader.loadProviders(forceRefresh);
  }

  private getLanguageIdByExt(ext: string) {
    const config = this.configManager.getConfiguration();
    const languagesConfig = config.languages;
    const languageConfig = languagesConfig.find((languageConfig) =>
      languageConfig.extensions.includes(ext),
    );
    return languageConfig ? languageConfig.id : undefined;
  }

  private async findProvider(document: vscode.TextDocument) {
    let languageId = document.languageId;
    // 如果没有识别到自定义语言，则尝试使用后缀匹配
    if (languageId === 'plaintext') {
      const ext = path.extname(document.uri.fsPath).slice(1);
      const tmpLanguageId = this.getLanguageIdByExt(`.${ext}`);
      if (tmpLanguageId) {
        languageId = tmpLanguageId;
      }
    }

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
        if (provider instanceof VscodeInternalProvider) {
          await provider.getBlockCommentFromVscode(languageId);
          return true;
        }
        return provider.languages.includes(languageId);
      })();

      if (isLanguageMatch) {
        return provider;
      }
    }
    logger.info(new CustomError(ErrorCode.LanguageProviderNotFound));
  }

  private async fileChanged(config: Config, document: vscode.TextDocument) {
    // 只支持脏文档时，如果当前文档不是脏文档，则标记跳过
    if (config.updateHeaderForModifiedFilesOnly && !document.isDirty) {
      return true;
    }

    const vcsProvider = await initVCSProvider();
    // 是否跟踪
    const isTracked = await vcsProvider.isTracked(document.fileName);
    // 是否有修改
    const isChanged = isTracked ? await vcsProvider.isChanged(document.fileName) : false;
    // 有跟踪则判断是否有修改
    // 没有跟踪则判断是否有 hash 更新
    return (isTracked && isChanged) || this.fileHashManager.isHashUpdated(document);
  }

  // 避免 prettier 这类格式后处理空格，导致文件头内容变化影响判断
  private headerChanged(
    document: vscode.TextDocument,
    fileheaderRange: vscode.Range,
    newFileheader: string,
    config: Config,
  ) {
    const originContent = document.getText(fileheaderRange)?.replace(/\r\n/g, '\n');
    const originContentLineCount = originContent.split('\n').length;
    const dateformat = config.get(ConfigSection.dateFormat, 'YYYY-MM-DD HH:mm:ss');
    const dateRegex = new RegExp(convertDateFormatToRegex(dateformat), 'g');

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
      const originContentProcessed = removeSpecialString(originContentLines.join('\n'), [
        dateRegex,
      ]);

      let newFileheaderLines = newFileheader.split('\n').map((line) => line.trim());
      if (
        newFileheaderLines.length > 3 &&
        !newFileheaderLines[0].match(/[a-zA-Z0-9]/) &&
        !newFileheaderLines[newFileheaderLines.length - 1].match(/[a-zA-Z0-9]/)
      ) {
        newFileheaderLines = newFileheaderLines.slice(1, -1);
      }
      const newFileheaderProcessed = removeSpecialString(newFileheaderLines.join('\n'), [
        dateRegex,
      ]);

      headerSame = originContentProcessed === newFileheaderProcessed;
    } else {
      const originContentProcessed = removeSpecialString(originContent, dateRegex);
      const newFileheaderProcessed = removeSpecialString(newFileheader, dateRegex);
      headerSame = originContentProcessed === newFileheaderProcessed;
    }
    return !headerSame;
  }

  private async shouldUpdate(
    document: vscode.TextDocument,
    originFileheaderInfo: OriginFileheaderInfo,
    newFileheader: string,
    config: Config,
    allowInsert: boolean,
    newFile: boolean,
  ) {
    // 新文件先根据匹配模式判断是否添加文件头，新文件肯定是没内容
    if (newFile) {
      return this.fileMatcher.shouldAddHeader(document.uri.fsPath);
    }

    const { range, contentWithoutHeader } = originFileheaderInfo;
    const content = document.getText();
    // 没有内容，认为可以增加文件头
    if (!content) {
      return true;
    }

    // 只有文件头时，认为没有修改
    if (!contentWithoutHeader) {
      return false;
    }

    // 范围开始和结束不相同（有文件头）
    const noHeader = range.start.isEqual(range.end);

    if (!allowInsert && noHeader) {
      // 不允许插入，且范围开始和结束相同（没有文件头的空间）
      return false;
    } else if (noHeader) {
      // 没文件头，允许插入，直接返回 true
      return true;
    } else {
      const isMainTextChange = this.fileHashManager.isMainTextUpdated(
        document,
        contentWithoutHeader,
      );
      const fileIsChanged = await this.fileChanged(config, document);
      if (!noHeader && fileIsChanged && isMainTextChange) {
        // 文件有修改且是正文，则直接返回
        // 文件有修改，则第一次认为是有修改，缓存起来
        return true;
      } else if (!noHeader && fileIsChanged && !isMainTextChange) {
        // 文件有修改，不是正文，就判断文件头是否相同
        return this.headerChanged(document, range, newFileheader, config);
      }

      // 都不是，则认为都没有修改
      return false;
    }
  }

  private async processFileheaderInsertionOrReplacement(
    document: vscode.TextDocument,
    provider: LanguageProvider,
    originFileheaderInfo: OriginFileheaderInfo,
    fileheaderVariable: IFileheaderVariables,
    config: Config,
    allowInsert: boolean,
    newFile: boolean,
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
      originFileheaderInfo,
      fileheader,
      config,
      allowInsert,
      newFile,
    );
    if (!shouldUpdate) {
      logger.info('Not need update filer header:', document.uri.fsPath);
      return false;
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
    logger.info('File header updated:', document.uri.fsPath);
    return true;
  }

  public async updateFileheader(
    document: vscode.TextDocument,
    {
      allowInsert = true,
      addSelection = false,
      newFile = false,
    }: UpdateFileheaderManagerOptions = {},
  ) {
    const config = this.configManager.getConfiguration();
    const provider = await this.findProvider(document);

    if (!provider) {
      !allowInsert && logger.handleError(new CustomError(ErrorCode.LanguageNotSupport));
      return;
    }

    const originFileheaderInfo = this.fileheaderProviderService.getOriginFileheaderInfo(
      document,
      provider,
      config.patternMultiline,
    );
    let fileheaderVariable: IFileheaderVariables;
    try {
      fileheaderVariable = await this.fileheaderVariableBuilder?.build(
        document.uri,
        provider,
        originFileheaderInfo.variables,
      );
    } catch (error) {
      logger.handleError(new CustomError(ErrorCode.VariableBuilderFail, error));
      return;
    }

    const result = await this.processFileheaderInsertionOrReplacement(
      document,
      provider,
      originFileheaderInfo,
      fileheaderVariable,
      config,
      allowInsert,
      newFile,
    );
    if (result && addSelection) {
      addSelectionAfterString(document, 'description');
    }

    this.fileHashManager.set(document);
  }

  public recordOriginFileHash(documents: readonly vscode.TextDocument[]) {
    for (const document of documents) {
      this.fileHashManager.set(document);
    }
  }

  public updateOriginFileHash(document: vscode.TextDocument) {
    this.fileHashManager.set(document);
  }

  public async batchUpdateFileheader() {
    let failedFiles = (await this.fileMatcher.findFiles()) || [];
    const totalFiles = failedFiles.length;
    let processedFiles = 0;

    await withProgress(
      'Updating File Header',
      async (progress) => {
        while (failedFiles.length > 0) {
          let reprocessedFiles: vscode.Uri[] = [];
          for (const file of failedFiles) {
            try {
              const document = await vscode.workspace.openTextDocument(file);
              await this.updateFileheader(document);
              await document.save();
              vscode.commands.executeCommand('workbench.action.closeActiveEditor');
              processedFiles++;
              updateProgress(progress, processedFiles, totalFiles);
            } catch (error) {
              reprocessedFiles.push(file);
              logger.handleError(
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
      totalFiles,
    );
  }
}

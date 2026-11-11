import vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { CustomError, ErrorCode } from '@/error';
import { FileMatcher } from '@/extension-operate/FileMatcher';
import { FunctionParserLoader } from '@/function-params-parser/FunctionParserLoader';
import { FunctionCommentInfo, FunctionParamsInfo } from '@/function-params-parser/types';
import { LanguageProvider } from '@/language-providers';
import { logger } from '@/services';
import { addSelectionAfterString, generateFunctionComment } from '@/utils/vscode-utils';
import { updateProgress, withProgress } from '@/utils/with-progress';

import { IFileheaderVariables } from '../typings/types';
import { FileHashManager } from './FileHashManager';
import { FileheaderProviderLoader } from './FileheaderProviderLoader';
import { findProvider } from './fileheaderProviderLoaderService';
import { getOriginFileheaderInfo } from './fileheaderProviderService';
import { processFileheaderInsertionOrReplacement } from './fileheaderUpdateService';
import { FileheaderVariableBuilder } from './FileheaderVariableBuilder';
import { UpdateFileheaderManagerOptions } from './types';

export class FileheaderManager {
  private configManager: ConfigManager;
  private fileMatcher: FileMatcher;
  private providers: LanguageProvider[] = [];
  private fileheaderProviderLoader: FileheaderProviderLoader;
  private fileHashManager: FileHashManager;
  private fileheaderVariableBuilder: FileheaderVariableBuilder;
  private functionParserLoader: FunctionParserLoader;

  constructor(
    configManager: ConfigManager,
    fileMatcher: FileMatcher,
    fileheaderProviderLoader: FileheaderProviderLoader,
    fileHashManager: FileHashManager,
    fileheaderVariableBuilder: FileheaderVariableBuilder,
    functionParserLoader: FunctionParserLoader,
  ) {
    this.configManager = configManager;
    this.fileMatcher = fileMatcher;
    this.fileheaderProviderLoader = fileheaderProviderLoader;
    this.fileHashManager = fileHashManager;
    this.fileheaderVariableBuilder = fileheaderVariableBuilder;
    this.functionParserLoader = functionParserLoader;
  }

  public async loadProviders(forceRefresh = false) {
    this.providers = await this.fileheaderProviderLoader.loadProviders(forceRefresh);
  }

  /**
   * Update or insert file header for a document
   * @param document - The document to update
   * @param options - Update options
   * @param options.allowInsert - Whether to allow inserting header if not exists (default: true)
   * @param options.addSelection - Whether to add cursor selection after update (default: false)
   * @param options.newFile - Whether this is a new file (default: false)
   * @returns Promise<boolean> - true if updated successfully
   */
  public async updateFileheader(
    document: vscode.TextDocument,
    {
      allowInsert = true,
      addSelection = false,
      newFile = false,
      autoSave = true,
    }: UpdateFileheaderManagerOptions = {},
  ) {
    const config = this.configManager.getConfiguration();
    const provider = await findProvider(this.configManager, this.providers, document);

    if (!provider) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      !allowInsert && logger.handleError(new CustomError(ErrorCode.LanguageNotSupport));
      return;
    }

    const originFileheaderInfo = getOriginFileheaderInfo(
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

    const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Active, true);
    const result = await processFileheaderInsertionOrReplacement(
      this.fileMatcher,
      this.fileHashManager,
      editor,
      provider,
      originFileheaderInfo,
      fileheaderVariable,
      config,
      allowInsert,
      newFile,
      autoSave,
    );
    if (!result) {
      return false;
    }

    if (addSelection) {
      addSelectionAfterString(document, 'description');
    }

    this.updateOriginFileHash(document);
    return true;
  }

  /**
   * Batch update file headers for multiple files based on include/exclude patterns
   * Shows progress notification during update
   */
  public async batchUpdateFileheader() {
    const files = (await this.fileMatcher.findFiles()) || [];
    const totalFiles = files.length;
    let processedFiles = 0;
    // 失败文件最多重试次数，避免持续失败的文件（如二进制/损坏文件）导致死循环
    const maxRetries = 2;

    await withProgress(
      'Updating File Header',
      async (progress) => {
        let pendingFiles = files;
        for (let attempt = 0; attempt <= maxRetries && pendingFiles.length > 0; attempt++) {
          const failedFiles: vscode.Uri[] = [];
          for (const file of pendingFiles) {
            try {
              const document = await vscode.workspace.openTextDocument(file);
              await this.updateFileheader(document);
              await document.save();
              vscode.commands.executeCommand('workbench.action.closeActiveEditor');
              processedFiles++;
              updateProgress(progress, processedFiles, totalFiles);
            } catch (error) {
              failedFiles.push(file);
              logger.handleError(
                new CustomError(ErrorCode.UpdateFileHeaderFail, file.fsPath, error),
              );
            }
          }
          pendingFiles = failedFiles;
        }
      },
      totalFiles,
    );
  }

  // 要被 DocumentHandler 调用
  public recordOriginFileHash(documents: readonly vscode.TextDocument[]) {
    for (const document of documents) {
      this.fileHashManager.set(document);
    }
  }

  // 要被 DocumentHandler 调用
  public updateOriginFileHash(document: vscode.TextDocument) {
    this.fileHashManager.set(document);
  }

  /**
   * Generate and insert function comment at cursor position
   * Automatically parses function signature and creates comment template
   * @param activeEditor - The active text editor
   * @returns Promise<void>
   */
  public async updateFunctionComment(activeEditor: vscode.TextEditor) {
    const document = activeEditor.document;
    const parser = await this.functionParserLoader.loadParser(document.languageId);
    const functionParamsInfo = parser?.getFunctionParamsAtCursor(activeEditor);

    // 查找操作文件的 provider
    const provider = await findProvider(this.configManager, this.providers, document);
    if (!provider) {
      logger.handleError(new CustomError(ErrorCode.LanguageNotSupport));
      return;
    }

    const { matchedFunction, insertPosition } = functionParamsInfo || {};
    if (matchedFunction && insertPosition) {
      const comments = provider.comments;
      const range = parser?.getOriginFunctionCommentRange(comments, document, insertPosition);
      // 原来有函数注释
      if (range) {
        const originFunctionInfo: FunctionCommentInfo = parser?.parseFunctionComment(
          document,
          range,
        ) || {
          paramsInfo: {},
          returnInfo: {},
          descriptionInfo: '',
        };
        const functionCommentInfo = parser?.generateFunctionCommentInfo(
          functionParamsInfo as unknown as FunctionParamsInfo,
          originFunctionInfo,
        );

        if (functionCommentInfo) {
          const { paramNameBeforeType = true } = parser?.getLanguageSettings() ?? {};
          const originFunctionComment = generateFunctionComment(
            comments,
            originFunctionInfo,
            paramNameBeforeType,
            true,
          );
          const functionComment = generateFunctionComment(
            comments,
            functionCommentInfo,
            paramNameBeforeType,
            false,
          );
          // 函数注释没有变化
          if (originFunctionComment === functionComment) {
            logger.info('Not need update function comment:', document.uri.fsPath);
            return false;
          }

          await activeEditor.edit((editBuilder) => {
            editBuilder.replace(range, functionComment + '\n');
          });

          await document.save();
          logger.info('Function comment updated:', document.uri.fsPath);
          return true;
        }
      }
    }
    logger.info('Not need update function comment:', document.uri.fsPath);
    return false;
  }
}

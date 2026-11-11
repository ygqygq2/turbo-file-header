import { CustomError, Logger } from '@ygqygq2/vscode-log';
import * as vscode from 'vscode';

import { CHANNEL_TITLE } from '@/constants';
import { FileheaderManager } from '@/fileheader/FileheaderManager';
import { LanguageEvent } from '@/languages/LanguageEvent';

import { ConfigEvent } from './configuration/ConfigEvent';
import { ConfigManager } from './configuration/ConfigManager';
import { ConfigReader } from './configuration/ConfigReader';
import { errorCodeMessages } from './error';
import { ContextService } from './extension-operate/ContextService';
import { FileMatcher } from './extension-operate/FileMatcher';
import { FileHashManager } from './fileheader/FileHashManager';
import { FileheaderProviderLoader } from './fileheader/FileheaderProviderLoader';
import { FileheaderVariableBuilder } from './fileheader/FileheaderVariableBuilder';
import { GenerateTemplateConfig } from './fileheader/GenerateTemplateConfig';
import { FunctionParserLoader } from './function-params-parser/FunctionParserLoader';
import { GenerateCustomProviderClasses } from './language-providers/GenerateCustomProviderClasses';
import { LanguageManager } from './languages/LanguageManager';

// 集中在此完成全局配置与单例创建，业务模块统一从本模块导入，
// 避免反向依赖 @/extension 入口形成循环依赖
CustomError.configure(errorCodeMessages);
Logger.configure(vscode.window, CHANNEL_TITLE);

export const logger = Logger.getInstance();
export const configReader = ConfigReader.getInstance();
export const configManager = ConfigManager.getInstance(configReader);
export const fileMatcher = new FileMatcher(configManager);
export const configEvent = new ConfigEvent(configManager);
export const languageManager = LanguageManager.getInstance(configManager);
export const languageEvent = new LanguageEvent(languageManager);
const generateCustomProviderClasses = new GenerateCustomProviderClasses(configReader);
const fileheaderProviderLoader = new FileheaderProviderLoader(
  configManager,
  languageManager,
  generateCustomProviderClasses,
);
export const fileHashManager = new FileHashManager();
export const fileheaderVariableBuilder = new FileheaderVariableBuilder(configManager);
export const functionParserLoader = new FunctionParserLoader(configManager);
export const fileheaderManager = new FileheaderManager(
  configManager,
  fileMatcher,
  fileheaderProviderLoader,
  fileHashManager,
  fileheaderVariableBuilder,
  functionParserLoader,
);
export const generateCustomTemplate = GenerateTemplateConfig.getInstance();
export const contextService = new ContextService();

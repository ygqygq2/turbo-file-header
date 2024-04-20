import { ConfigManager } from '@/configuration/ConfigManager';
import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';

import { FunctionParamsParser } from './FunctionParamsParser';
import { GoParser } from './GoProvider';
import { JavascriptParser } from './JavascriptProvider';
import { TypescriptParser } from './TypescriptProvider';

export class FunctionParserLoader {
  private configManager: ConfigManager;
  private parsersCache: { [languageId: string]: FunctionParamsParser } = {};

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  // 创建一个映射，将每种语言映射到相应的解析器类
  private parserClasses: {
    [languageId: string]: new (
      configManager: ConfigManager,
      languageId: string,
    ) => FunctionParamsParser;
  } = {
    typescript: TypescriptParser,
    typescriptreact: TypescriptParser,
    javascript: JavascriptParser,
    javascriptreact: JavascriptParser,
    go: GoParser,
  };

  public async loadParser(languageId: string): Promise<FunctionParamsParser | null> {
    if (this.parsersCache[languageId]) {
      return this.parsersCache[languageId];
    }

    // 查找相应的解析器类
    const ParserClass = this.parserClasses[languageId];
    if (!ParserClass) {
      logger.handleError(new CustomError(ErrorCode.NotFoundParser, languageId));
      return null;
    }

    // 创建解析器实例并添加到缓存中
    this.parsersCache[languageId] = new ParserClass(this.configManager, languageId);

    return this.parsersCache[languageId];
  }
}

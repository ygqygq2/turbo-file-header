import { ConfigManager } from '@/configuration/ConfigManager';
import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';

import { CParser } from './CProvider';
import { FunctionParamsParser } from './FunctionParamsParser';
import { GoParser } from './GoProvider';
import { JavaParser } from './JavaProvider';
import { JavascriptParser } from './JavascriptProvider';
import { PhpParser } from './PhpProvider';
import { PythonParser } from './PythonProvider';
import { RustParser } from './RustProvider';
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
    vue: TypescriptParser,
    go: GoParser,
    java: JavaParser,
    python: PythonParser,
    php: PhpParser,
    rust: RustParser,
    c: CParser,
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

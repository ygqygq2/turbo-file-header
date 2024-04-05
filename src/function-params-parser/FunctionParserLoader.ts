import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';
import { FunctionParamsParser } from './FunctionParamsParser';
import { TypescriptParser } from './TypescriptProvider';

export class FunctionParserLoader {
  private parsersCache: { [languageId: string]: FunctionParamsParser } = {};

  // 创建一个映射，将每种语言映射到相应的解析器类
  private parserClasses: { [languageId: string]: new () => FunctionParamsParser } = {
    typescript: TypescriptParser,
    typescriptreact: TypescriptParser,
    javascript: TypescriptParser,
    javascriptreact: TypescriptParser,
    // 添加其他的语言和解析器类...
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
    this.parsersCache[languageId] = new ParserClass();

    return this.parsersCache[languageId];
  }
}

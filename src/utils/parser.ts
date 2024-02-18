import * as vscode from 'vscode';
import { Configuration } from './configuration';

export class Parser {
  private expression: string = '';

  private delimiter: string = '';

  public blockCommentStart: string = '';
  public blockCommentEnd: string = '';

  // * this will allow plaintext files to show comment highlighting if switched on
  private isPlainText = false;

  // * this is used to prevent the first line of the file (specifically python) from coloring like other comments
  private ignoreFirstLine = false;

  // * this is used to trigger the events when a supported language code is found
  public supportedLanguage = true;

  // Read from the package.json
  private contributions: vscode.WorkspaceConfiguration =
    vscode.workspace.getConfiguration('turboFileHeader');

  // The configuration necessary to find supported languages on startup
  private configuration: Configuration;

  /**
   * Creates a new instance of the Parser class
   * @param configuration
   */
  public constructor(config: Configuration) {
    this.configuration = config;
  }

  /**
   * Sets the regex to be used by the matcher based on the config specified in the package.json
   * @param languageId The short code of the current language
   * https://code.visualstudio.com/docs/languages/identifiers
   */
  public async SetRegex(languageId: string) {
    await this.setDelimiter(languageId);

    // if the language isn't supported, we don't need to go any further
    if (!this.supportedLanguage) {
      return;
    }

    if (this.isPlainText && this.contributions.supportPlainText) {
      // start by tying the regex to the first character in a line
      this.expression = '(^)+([ \\t]*[ \\t]*)';
    } else {
      // start by finding the delimiter (//, --, #, ') with optional spaces or tabs
      this.expression = '(' + this.delimiter + ')+( |\t)*';
    }
  }

  /**
   * Sets the comment delimiter [//, #, --, '] of a given language
   * @param languageId The short code of the current language
   * https://code.visualstudio.com/docs/languages/identifiers
   */
  private async setDelimiter(languageId: string): Promise<void> {
    this.supportedLanguage = false;
    this.ignoreFirstLine = false;
    this.isPlainText = false;

    const config = await this.configuration.GetCommentConfiguration(languageId);
    if (config) {
      const blockCommentStart = config.blockComment ? config.blockComment[0] : null;
      const blockCommentEnd = config.blockComment ? config.blockComment[1] : null;

      this.setCommentFormat(
        config.lineComment || blockCommentStart,
        blockCommentStart,
        blockCommentEnd,
      );

      this.supportedLanguage = true;
    }

    // 一些特殊处理
    switch (languageId) {
      // case 'apex':
      // case 'javascript':
      // case 'javascriptreact':
      // case 'typescript':
      // case 'typescriptreact':
      //   break;
      case 'elixir':
      case 'python':
      case 'tcl':
        this.ignoreFirstLine = true;
        break;
      case 'plaintext':
        this.isPlainText = true;
        this.supportedLanguage = this.contributions.supportPlainText;
        break;
    }
  }

  /**
   * Escapes a given string for use in a regular expression
   * @param input The input string to be escaped
   * @returns {string} The escaped string
   */
  private escapeRegExp(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  /**
   * Set up the comment format for single and multiline support
   * @param singleLine The single line comment delimiter. If NULL, single line is not supported
   * @param start The start delimiter for block comments
   * @param end The end delimiter for block comments
   */
  private setCommentFormat(
    singleLine: string | string[] | null,
    start: string | null = null,
    end: string | null = null,
  ): void {
    this.delimiter = '';
    this.blockCommentStart = '';
    this.blockCommentEnd = '';

    // If no single line comment delimiter is passed, single line comments are not supported
    if (singleLine) {
      if (typeof singleLine === 'string') {
        this.delimiter = this.escapeRegExp(singleLine).replace(/\//gi, '\\/');
      } else if (singleLine.length > 0) {
        // * if multiple delimiters are passed, the language has more than one single line comment format
        const delimiters = singleLine.map((s) => this.escapeRegExp(s)).join('|');
        this.delimiter = delimiters;
      }
    }

    if (start && end) {
      this.blockCommentStart = this.escapeRegExp(start);
      this.blockCommentEnd = this.escapeRegExp(end);
    }
  }
}

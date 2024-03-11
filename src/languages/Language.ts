import * as vscode from 'vscode';
import { getBaseCommentRule, loadCommentRuleFromFile } from './base';
import { AvailableComments } from './types';

export class Language {
  public readonly languageId: string;
  private configUri: vscode.Uri | undefined;
  private configuration: vscode.LanguageConfiguration | undefined;
  private embeddedLanguages = new Set<string>();
  private comments: vscode.CommentRule | undefined;
  private availableComments: AvailableComments | undefined;

  constructor(languageId: string, configUri?: vscode.Uri) {
    this.languageId = languageId;
    this.setConfigUri(configUri);
  }

  /**
   * Set configuration uri
   */
  public setConfigUri(configUri?: vscode.Uri) {
    this.configUri = configUri;
    return this;
  }

  public setConfiguration(configuration: vscode.LanguageConfiguration) {
    this.configuration = configuration;
  }

  /**
   * Check if config uri already setup
   */
  hasConfigUri() {
    return !!this.configUri;
  }

  /**
   * ! test
   * Get language comments rules
   */
  public getComments = async (forceRefresh = false) => {
    let comments: vscode.CommentRule | undefined;

    if (!this.comments || forceRefresh) {
      if (this.configuration && this.configuration.comments) {
        comments = this.configuration.comments;
      } else if (this.configUri) {
        // load comment rule from file
        comments = await loadCommentRuleFromFile(this.configUri);
      }
      // get base comment rule if undefined from file
      if (!comments) {
        comments = getBaseCommentRule(this.languageId);
      }
      // set comments
      this.comments = comments || {};
    }

    return this.comments;
  };

  /**
   * Get language line comment
   */
  public getLineComment = async () => {
    return (await this.getComments()).lineComment;
  };

  /**
   * Get language block comment
   */
  public getBlockComment = async () => {
    return (await this.getComments()).blockComment;
  };

  /**
   * Add embedded language id
   */
  public addEmbeddedLanguage = (languageId: string) => {
    this.embeddedLanguages.add(languageId);
    return this;
  };

  /**
   * Get embedded language ids
   */
  public getEmbeddedLanguages = () => {
    return Array.from(this.embeddedLanguages);
  };

  /**
   * Replace embeddedLanguages
   */
  public setEmbeddedLanguages = (embeddedLanguages: Set<string>) => {
    this.embeddedLanguages = embeddedLanguages;
    return this;
  };

  /**
   * Get available comments
   */
  public getAvailableComments = () => {
    return this.availableComments;
  };

  /**
   * Set available comments
   */
  setAvailableComments(comments: AvailableComments) {
    this.availableComments = comments;
    return this;
  }
}

import type * as vscode from 'vscode';
import { getBaseCommentRule, loadCommentRuleFromFile } from './base';
import { AvailableComments } from './types';

export class Language {
  public readonly languageId: string;
  private configUri: vscode.Uri | undefined;
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
    if (!this.comments || forceRefresh) {
      // load comment rule from file
      let comments = await loadCommentRuleFromFile(this.configUri);
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

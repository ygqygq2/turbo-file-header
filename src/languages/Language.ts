import type * as vscode from 'vscode';
import { getBaseCommentRule, loadCommentRuleFromFile } from './base';

export interface AvailableComments {
  lineComments: string[];
  blockComments: vscode.CharacterPair[];
}

export default class Language {
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
  setConfigUri(configUri?: vscode.Uri) {
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
  async getComments(forceRefresh = false) {
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
  }

  /**
   * Get language line comment
   */
  async getLineComment() {
    return (await this.getComments()).lineComment;
  }

  /**
   * Get language block comment
   */
  async getBlockComment() {
    return (await this.getComments()).blockComment;
  }

  /**
   * Add embedded language id
   */
  addEmbeddedLanguage(languageId: string) {
    this.embeddedLanguages.add(languageId);
    return this;
  }

  /**
   * Get embedded language ids
   */
  getEmbeddedLanguages() {
    return Array.from(this.embeddedLanguages);
  }

  /**
   * Replace embeddedLanguages
   */
  setEmbeddedLanguages(embeddedLanguages: Set<string>) {
    this.embeddedLanguages = embeddedLanguages;
    return this;
  }

  /**
   * Get avaiable comments
   */
  getAvailableComments() {
    return this.availableComments;
  }

  /**
   * Set avaiable comments
   */
  setAvailableComments(comments: AvailableComments) {
    this.availableComments = comments;
    return this;
  }
}

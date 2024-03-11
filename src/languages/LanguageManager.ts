import * as vscode from 'vscode';
import { Language } from './Language';
import { AvailableCommentRules } from './types';
import { LanguageConfig, LanguagesConfig } from '@/typings/types';
import output from '@/error/output';
import { ConfigTag } from '@/constants';

export class LanguageManager {
  private static instance: LanguageManager;
  private languages: Map<string, Language> = new Map<string, Language>();

  private constructor() {
    this.updateDefinitions();
  }

  public static getInstance(): LanguageManager {
    return LanguageManager.instance || new LanguageManager();
  }

  public useLanguage = (languageId: string, autoUpdateDefinition = true) => {
    if (this.languages.size === 0 && autoUpdateDefinition) {
      this.updateDefinitions();
    }

    let lang = this.languages.get(languageId);

    if (!lang) {
      lang = new Language(languageId);
      this.languages.set(languageId, lang);
    }

    return lang;
  };

  /**
   * Generate a map of configuration files by language as defined by extensions
   * External extensions can override default configurations os VSCode
   */
  public updateDefinitions = () => {
    // this.languages.clear();

    for (const extension of vscode.extensions.all) {
      const packageJSON = extension.packageJSON;
      for (const language of packageJSON?.contributes?.languages || []) {
        const lang = this.useLanguage(language.id, false);

        // if has configuration
        if (language.configuration) {
          lang.setConfigUri(vscode.Uri.joinPath(extension.extensionUri, language.configuration));
        }

        const embeddedLanguages = new Set<string>();
        for (const grammar of packageJSON.contributes?.grammars || []) {
          if (grammar.language !== language.id || !grammar.embeddedLanguages) {
            continue;
          }
          for (const embeddedLanguageCode of Object.values(grammar.embeddedLanguages)) {
            embeddedLanguages.add(embeddedLanguageCode as string);
          }
        }

        lang.setEmbeddedLanguages(embeddedLanguages);
      }
    }
  };

  public getLanguagesConfig(languages: LanguagesConfig) {
    languages.forEach((language: LanguageConfig) => {
      const { configuration } = language;
      console.log('🚀 ~ file: LanguageManager.ts:70 ~ configuration:', configuration);
      const { comments } = configuration;
      if (Object.keys(comments).length > 0) {
        const uri = vscode.Uri.file(ConfigTag + language.id);
        vscode.languages.setLanguageConfiguration(language.id, { comments });
        const lang = this.useLanguage(language.id, false);
        if (configuration) {
          lang.setConfigUri(uri);
        }
      } else {
        output.info(vscode.l10n.t('No language configuration comments found for') + language.id);
      }
    });
  }

  /**
   * Gets the configuration information for the specified language
   */
  public getAvailableCommentRules = async (languageId: string): Promise<AvailableCommentRules> => {
    const lang = this.useLanguage(languageId);

    let availableComments = lang.getAvailableComments();

    if (availableComments) {
      return availableComments;
    }

    const lineComments = new Set<string>();
    const blockComments = new Map<string, vscode.CharacterPair>();

    // 用于记录已处理过的语言
    const processedLanguages: Set<string> = new Set();
    const processLanguageComments = async (lang: Language) => {
      const comments = await lang.getComments();
      if (comments.lineComment) {
        lineComments.add(comments.lineComment);
      }
      if (comments.blockComment) {
        const key = `${comments.blockComment[0]}${comments.blockComment[1]}`;
        blockComments.set(key, comments.blockComment);
      }

      const embeddedLanguages = lang.getEmbeddedLanguages();
      for (const embeddedLanguageCode of embeddedLanguages) {
        if (!processedLanguages.has(embeddedLanguageCode)) {
          processedLanguages.add(embeddedLanguageCode);
          const embeddedLang = this.useLanguage(embeddedLanguageCode);
          await processLanguageComments(embeddedLang);
        }
      }
    };

    await processLanguageComments(lang);

    availableComments = {
      lineComments: Array.from(lineComments),
      blockComments: [...blockComments.values()],
    };

    lang.setAvailableComments(availableComments);
    return availableComments;
  };
}

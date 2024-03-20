import vscode from 'vscode';
import { LanguageProvider } from '@/language-providers';
import { IFileheaderVariables } from '../typings/types';

export class FileheaderProviderService {
  public getOriginFileheaderRange(document: vscode.TextDocument, provider: LanguageProvider) {
    const range = provider.getOriginFileheaderRange(document);
    return range;
  }

  public getOriginFileheaderInfo(document: vscode.TextDocument, provider: LanguageProvider) {
    const range = this.getOriginFileheaderRange(document, provider);
    const contentWithoutHeader = provider.getOriginContentWithoutFileheader(document, range);

    const pattern = provider.getOriginFileheaderRegExp(document.eol);
    console.log("🚀 ~ file: FileheaderProviderService.ts:16 ~ pattern:", pattern);
    const info: {
      range: vscode.Range;
      variables?: IFileheaderVariables;
      contentWithoutHeader: string;
    } = {
      range,
      variables: undefined,
      contentWithoutHeader,
    };

    const contentWithHeader = document.getText(range);
    console.log("🚀 ~ file: FileheaderProviderService.ts:28 ~ contentWithHeader:", contentWithHeader);
    const result = contentWithHeader.match(pattern);
    if (result) {
      info.variables = result.groups;
    }
    return info;
  }
}

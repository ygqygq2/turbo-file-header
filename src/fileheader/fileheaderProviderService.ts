import { LanguageProvider } from '@/language-providers';
import vscode from 'vscode';

export function getOriginFileheaderRange(
  document: vscode.TextDocument,
  provider: LanguageProvider,
) {
  const range = provider.getOriginFileheaderRange(document);
  return range;
}

export function getOriginFileheaderInfo(
  document: vscode.TextDocument,
  provider: LanguageProvider,
  patternMultiline: boolean,
) {
  const range = getOriginFileheaderRange(document, provider);
  const contentWithoutHeader = provider.getOriginContentWithoutFileheader(document, range);

  const patterns = provider.getOriginFileheaderRegExp(document.eol, patternMultiline);
  const info: {
    range: vscode.Range;
    variables?: { [key: string]: string };
    contentWithoutHeader: string;
  } = {
    range,
    variables: undefined,
    contentWithoutHeader,
  };

  const contentWithHeader = document.getText(range);
  if (patternMultiline === false) {
    if (patterns instanceof Array) {
      for (const pattern of patterns) {
        const result = contentWithHeader.match(pattern);
        if (result) {
          if (!info.variables) {
            info.variables = {};
          }
          Object.assign(info.variables, result.groups);
        }
      }
    }
  } else {
    if (patterns instanceof RegExp) {
      const result = contentWithHeader.match(patterns);
      if (result) {
        info.variables = result.groups;
      }
    }
  }
  return info;
}

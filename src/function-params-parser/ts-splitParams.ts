import { LanguageFunctionCommentSettings } from '@/typings/types';

import { ParamsInfo, ReturnInfo } from './types';

export function splitParams(
  paramsStr: string,
  languageSettings: LanguageFunctionCommentSettings,
): ParamsInfo {
  const { defaultParamType = 'any' } = languageSettings;
  let bracketCount = 0;
  let paramStartIndex = 0;
  const params: ParamsInfo = {};
  for (let i = 0; i < paramsStr.length; i++) {
    const char = paramsStr[i];
    if (char === '(' || char === '[' || char === '{' || char === '<') {
      bracketCount++;
    } else if (char === ')' || char === ']' || char === '}' || char === '>') {
      bracketCount--;
    } else if (char === ',' && bracketCount === 0) {
      const paramStr = paramsStr.slice(paramStartIndex, i);
      const colonIndex = paramStr.indexOf(':');
      const equalIndex = paramStr.indexOf('=');
      const questionIndex = paramStr.indexOf('?');
      const name = paramStr
        .slice(
          0,
          questionIndex !== -1 ? questionIndex : colonIndex !== -1 ? colonIndex : paramStr.length,
        )
        .trim();
      const type =
        colonIndex !== -1
          ? paramStr.slice(colonIndex + 1, equalIndex !== -1 ? equalIndex : paramStr.length).trim()
          : defaultParamType;
      const paramInfo: any = { type, description: '' };
      if (equalIndex !== -1) {
        paramInfo.defaultValue = paramStr.slice(equalIndex + 1).trim();
      }
      if (questionIndex !== -1) {
        paramInfo.optional = true;
      }
      if (name) {
        params[name] = paramInfo;
      }
      paramStartIndex = i + 1;
    }
  }
  const paramStr = paramsStr.slice(paramStartIndex);
  const colonIndex = paramStr.indexOf(':');
  const equalIndex = paramStr.indexOf('=');
  const questionIndex = paramStr.indexOf('?');
  const name = paramStr
    .slice(
      0,
      questionIndex !== -1 ? questionIndex : colonIndex !== -1 ? colonIndex : paramStr.length,
    )
    .trim();
  const type =
    colonIndex !== -1
      ? paramStr.slice(colonIndex + 1, equalIndex !== -1 ? equalIndex : paramStr.length).trim()
      : defaultParamType;
  const paramInfo: any = { type, description: '' };
  if (equalIndex !== -1) {
    paramInfo.defaultValue = paramStr.slice(equalIndex + 1).trim();
  }
  if (questionIndex !== -1) {
    paramInfo.optional = true;
  }
  if (name) {
    params[name] = paramInfo;
  }
  return params;
}

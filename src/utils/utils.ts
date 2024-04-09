import { ChildProcess, ExecOptions, exec as _exec } from 'child_process';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER, TEMPLATE_SYMBOL_KEY } from '../constants';
import { CommandExecError } from '../error/CommandExecError';
import { Template, TemplateInterpolation } from '../typings/types';
import { escapeRegexString } from './str';

/**
 * whether text starts with `'#!'`
 */
export function hasShebang(text: string): boolean {
  const shebangPattern = /^#!\S/;
  return shebangPattern.test(text);
}

export function getTaggedTemplateInputs(
  strings: TemplateStringsArray,
  ...interpolations: TemplateInterpolation[]
): Template {
  return {
    [TEMPLATE_SYMBOL_KEY]: true,
    strings,
    interpolations,
  };
}

/**
 * Promisify node exec function
 */
export function exec(
  command: string,
  options: ExecOptions = {},
): Promise<string> & { handler: ChildProcess | null } {
  let handler: ChildProcess | null = null;
  const p = new Promise<string>((resolve, reject) => {
    handler = _exec(command, options, (error, stdout, stderr) => {
      if (stderr || error) {
        reject(new CommandExecError(stderr, stdout, error));
      } else {
        resolve(stdout);
      }
    });
  }) as Promise<string> & { handler: ChildProcess | null };

  p.handler = handler;
  return p;
}

export function getFirstLine(input: string) {
  return input.split('\n', 1)[0];
}

export function delayUntil(
  condition: () => boolean,
  intervalTimeout: number,
  rejectTimeout: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutTimer = setTimeout(() => {
      reject();
      clearInterval(intervalTimer);
      clearTimeout(timeoutTimer);
    }, rejectTimeout);

    const intervalTimer = setInterval(() => {
      if (condition()) {
        clearInterval(intervalTimer);
        clearTimeout(timeoutTimer);
        resolve();
      }
    }, intervalTimeout);
  });
}

/**
 * recursive evaluate the given template and interpolations
 * falsy value will be empty string
 */
export function evaluateTemplate(
  strings: ReadonlyArray<string>,
  interpolations: TemplateInterpolation[],
  addOptionalRegexpMark = false,
) {
  const [first, ...restStrings] = strings;
  const addMarks = (str: TemplateInterpolation) =>
    addOptionalRegexpMark
      ? `${TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER.start}${str}${TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER.end}`
      : str;
  let result = first;

  for (let index = 0; index < interpolations.length; index++) {
    const interpolation = interpolations[index];
    if (interpolation && typeof interpolation === 'object' && interpolation[TEMPLATE_SYMBOL_KEY]) {
      result +=
        addMarks(
          evaluateTemplate(
            interpolation.strings,
            interpolation.interpolations,
            addOptionalRegexpMark,
          ),
        ) || '';
      result += restStrings[index];
    } else {
      result += addMarks(interpolation || '') + restStrings[index];
    }
  }

  return result;
}

/**
 * get string hash of the given string
 * @param input the input string
 */
export function getStringHash(input: string) {
  return crypto.createHash('sha1').update(input).digest('base64');
}

/**
 * Sleep micro second
 * @param ms micro second to sleep
 */
export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * convert dateformat string to regex
 * @param dateFormat
 * @returns
 */
export function convertDateFormatToRegex(dateFormat: string): string {
  // 定义时间格式字符到正则表达式的映射
  const formatToRegexMap: { [key: string]: string } = {
    YYYY: '\\d{4}',
    MM: '\\d{2}',
    DD: '\\d{2}',
    HH: '\\d{2}',
    mm: '\\d{2}',
    ss: '\\d{2}',
  };

  // 转义可能会干扰正则表达式的特殊字符
  dateFormat = escapeRegexString(dateFormat);

  // 替换所有时间格式字符为对应的正则表达式
  Object.keys(formatToRegexMap).forEach((format) => {
    dateFormat = dateFormat.replace(new RegExp(format, 'g'), formatToRegexMap[format]);
  });

  return dateFormat;
}

/**
 * query when it is enabled
 * @param disabled if true this function will return undefined immediately
 * @param queryAction get variable operation
 * @param fallbackVal fallback value, if it is falsy, it will throw the origin error
 * @returns variable value or fallback value
 */
export async function queryResultExceptDisable<T>(
  disabled: boolean,
  queryAction: () => Promise<T> | T,
  fallbackVal?: T,
): Promise<T | undefined> {
  if (disabled) {
    return undefined;
  }
  try {
    return await queryAction();
  } catch (e) {
    if (fallbackVal) {
      return fallbackVal;
    }
    throw e;
  }
}

export async function findVCSRoot(directory: string): Promise<string | null> {
  let currentDirectory = directory;
  while (currentDirectory !== path.parse(currentDirectory).root) {
    if (fs.existsSync(path.join(currentDirectory, '.git'))) {
      return currentDirectory;
    }
    if (fs.existsSync(path.join(currentDirectory, '.svn'))) {
      return currentDirectory;
    }
    currentDirectory = path.dirname(currentDirectory);
  }
  return null;
}

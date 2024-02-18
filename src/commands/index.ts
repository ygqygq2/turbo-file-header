import { Command } from '@/typings/types';
import { addFileheader } from './addFileheader';
import { generateCustomTemplate } from './generateCustomTemplate';
import { reloadCustomTemplateProvider } from './reloadCustomTemplateProvider';

export function getAllCommands(): Array<Command> {
  return [addFileheader(), generateCustomTemplate(), reloadCustomTemplateProvider()];
}

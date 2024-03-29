import { Command } from '@/typings/types';
import { addFileheader } from './addFileheader';
import { generateTemplateConfig } from './generateTemplateFile';
import { reloadCustomTemplateProvider } from './reloadCustomProvider';
import { batchUpdateFileheader } from './batchUpdateFileheader';

export function getAllCommands(): Array<Command> {
  return [
    addFileheader(),
    generateTemplateConfig(),
    reloadCustomTemplateProvider(),
    batchUpdateFileheader(),
  ];
}

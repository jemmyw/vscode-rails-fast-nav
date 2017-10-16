import { SwitchFile, CheckedSwitchFile, SwitchRule } from './types';
import { RailsWorkspaceCache } from './rails-workspace';
import { RailsFile } from './rails-file';
import * as fs from 'fs-extra';
import { rules } from './rules';

export async function getSwitchesFromRules(
  rules: SwitchRule[],
  railsFile: RailsFile
): Promise<SwitchFile[]> {
  const workspace = await RailsWorkspaceCache.fetch(railsFile.railsRoot);
  return await Promise.all(
    rules.map(rule => rule(railsFile, workspace))
  ).then(switches => [].concat(...switches));
}

export async function checkSwitchFiles(
  switchFiles: SwitchFile[]
): Promise<CheckedSwitchFile[]> {
  const withExisting = await Promise.all(
    switchFiles.map(async (switchFile: SwitchFile):Promise<SwitchFile> => {
      if (switchFile.checkedExists) {
        return switchFile as CheckedSwitchFile;
      }

      const exists = await fs.pathExists(switchFile.filename);

      return {
        ...switchFile,
        checkedExists: exists,
      };
    })
  );

  return withExisting.filter(sf => sf.checkedExists) as CheckedSwitchFile[];
}

export async function getCheckedSwitches(
  railsFile: RailsFile
): Promise<CheckedSwitchFile[]> {
  const switchFiles = await getSwitchesFromRules(rules, railsFile);
  return await checkSwitchFiles(switchFiles);
}

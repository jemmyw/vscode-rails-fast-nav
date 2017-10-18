import { SwitchFile, CheckedSwitchFile, SwitchRule, OrPromise } from './types';
import { RailsWorkspaceCache } from './rails-workspace';
import { RailsFile } from './rails-file';
import * as fs from 'fs-extra';
import { rules } from './rules';

export async function getSwitchesFromRule(
  rule: SwitchRule,
  railsFile: RailsFile
): Promise<CheckedSwitchFile[]> {
  const workspace = await RailsWorkspaceCache.fetch(railsFile.railsRoot);
  const switchFiles = rule(railsFile, workspace);
  return checkSwitchFiles(switchFiles);
}

export async function getSwitchesFromRules(
  rules: SwitchRule[],
  railsFile: RailsFile
): Promise<SwitchFile[]> {
  const workspace = await RailsWorkspaceCache.fetch(railsFile.railsRoot);
  return await Promise.all(
    rules.map(rule => rule(railsFile, workspace))
  ).then(switches => [].concat(...switches));
}

async function switchFileExists(switchFile: SwitchFile): Promise<boolean> {
  return switchFile.checkedExists || fs.pathExists(switchFile.filename);
}

async function checkSwitchFile(
  switchFile: OrPromise<SwitchFile>
): Promise<SwitchFile> {
  const resolvedSwitchFile = await Promise.resolve(switchFile);

  return {
    ...resolvedSwitchFile,
    checkedExists: await switchFileExists(resolvedSwitchFile),
  };
}

function existsFilter(switchFile: SwitchFile): boolean {
  return Boolean(switchFile.checkedExists);
}

export async function checkSwitchFiles(
  switchFiles: SwitchFile[] | Promise<SwitchFile[]>
): Promise<CheckedSwitchFile[]> {
  return (await Promise.all(
    (await Promise.resolve(switchFiles)).map(checkSwitchFile)
  )).filter(existsFilter) as CheckedSwitchFile[];
}

export async function getCheckedSwitches(
  railsFile: RailsFile
): Promise<CheckedSwitchFile[]> {
  return await checkSwitchFiles(getSwitchesFromRules(rules, railsFile));
}

import { SwitchFile, CheckedSwitchFile, SwitchRule, OrPromise } from './types';
import { RailsWorkspaceCache } from './rails-workspace';
import { RailsFile } from './rails-file';
import * as fs from 'fs-extra';
import { rules } from './rules';

function existsFilter(switchFile: SwitchFile): boolean {
  return Boolean(switchFile.checkedExists);
}

/**
 * Given a list of switch files, return the ones that exist on the filesystem
 */
export async function checkSwitchFiles(
  switchFiles: SwitchFile[] | Promise<SwitchFile[]>
): Promise<CheckedSwitchFile[]> {
  return (await Promise.all(
    (await Promise.resolve(switchFiles)).map(checkSwitchFile)
  )).filter(existsFilter) as CheckedSwitchFile[];
}

/**
 * Get the switch files (that exist) from a given rule
 */
export function getSwitchesFromRule(rule:SwitchRule):(railsFile:RailsFile) => Promise<CheckedSwitchFile[]>;
export function getSwitchesFromRule(rule:SwitchRule, railsFile:RailsFile):Promise<CheckedSwitchFile[]>;

export function getSwitchesFromRule(
  rule: SwitchRule,
  railsFile?: RailsFile
): any {
  const fn = async function(railsFile:RailsFile) {
    const workspace = await RailsWorkspaceCache.fetch(railsFile.railsRoot);
    const switchFiles = rule(railsFile, workspace);
    return checkSwitchFiles(switchFiles);
  }

  if (railsFile) { return fn(railsFile); }
  return fn;
}

/**
 * Get the switch files (that exist) from a set of rules
 * 
 */
export async function getSwitchesFromRules(
  rules: SwitchRule[],
  railsFile: RailsFile
): Promise<CheckedSwitchFile[]> {
  const workspace = await RailsWorkspaceCache.fetch(railsFile.railsRoot);
  const switchFiles = Promise.all(
    rules.map(rule => rule(railsFile, workspace))
  ).then(switches => [].concat(...switches));
  return checkSwitchFiles(switchFiles);
}

/**
 * Check to see if a switch file exists. If it has already been checked return
 * true, otherwise look to the filesystem.
 */
async function switchFileExists(switchFile: SwitchFile): Promise<boolean> {
  return switchFile.checkedExists || fs.pathExists(switchFile.filename);
}

/**
 * Check to see if a switch file exists and return the switch file with
 * `checkedExists` filled in.
 */
async function checkSwitchFile(
  switchFile: OrPromise<SwitchFile>
): Promise<SwitchFile> {
  const resolvedSwitchFile = await Promise.resolve(switchFile);

  return {
    ...resolvedSwitchFile,
    checkedExists: await switchFileExists(resolvedSwitchFile),
  };
}

/**
 * Return all available switch files using the preset rules.
 */
export async function getCheckedSwitches(
  railsFile: RailsFile
): Promise<CheckedSwitchFile[]> {
  return await getSwitchesFromRules(rules, railsFile);
}

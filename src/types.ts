import { RailsFile } from './rails-file';
import { RailsWorkspace } from './rails-workspace';

export interface SwitchFile {
  type: string;
  title: string;
  filename: string;
  checkedExists?: boolean;
}

export interface CheckedSwitchFile extends SwitchFile {
  checkedExists: true
}

export type OrPromise<T> = T | Promise<T>;

export type SwitchMatcher = (
  railsFile: RailsFile,
  workspace: RailsWorkspace
) => OrPromise<boolean>;
export type SwitchMaker = (
  railsFile: RailsFile,
  workspace: RailsWorkspace
) => OrPromise<SwitchFile[]>;
export type SwitchRule = (
  railsFile: RailsFile,
  workspace: RailsWorkspace
) => OrPromise<SwitchFile[]>;

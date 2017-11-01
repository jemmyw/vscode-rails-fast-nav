import { getCurrentRailsFile, RailsFile } from './rails-file';
import { RailsWorkspaceCache, RailsWorkspace } from './rails-workspace';
import { SwitchFile, SwitchRule } from './types';
import { getSwitchesFromRules } from './switches';

type InRailsContext = (
  callback: (railsFile: RailsFile, workspace: RailsWorkspace) => Promise<any>
) => Promise<any>;

export interface RailsContext {
  railsFile: RailsFile;
  workspace: RailsWorkspace;
  in: InRailsContext;
}

type InContextCallback<T> = (
  railsFile: RailsFile,
  workspace: RailsWorkspace,
  switchFiles?: SwitchFile[]
) => Promise<T>;

export function getRailsContext<T>(callback?: InContextCallback<T>): Promise<T>;
export function getRailsContext<T>(rules:SwitchRule[], callback?: InContextCallback<T>): Promise<T>;
export function getRailsContext(): Promise<RailsContext>;
export function getRailsContext(rules:SwitchRule[]): Promise<RailsContext>;
export function getRailsContext(...args: any[]): Promise<any> {
  let callback: InContextCallback<any>;
  let rules: SwitchRule[];

  if (args.length === 2) {
    rules = args[0];
    callback = args[1];
  } else if (args.length === 1 && Array.isArray(args[0])) {
    rules = args[0];
  } else if (args.length === 1) {
    callback = args[0];
  }

  const railsFile = getCurrentRailsFile();
  const workspacePromise = RailsWorkspaceCache.fetch(railsFile.railsRoot);
  const switchCallback = (railsFile, workspace) => {
      if (rules) {
        return getSwitchesFromRules(rules, railsFile).then(switchFiles => callback(railsFile, workspace, switchFiles))
      } else {
        return callback(railsFile, workspace);
      }
  }

  if (callback) {
    return workspacePromise.then(workspace => switchCallback(railsFile, workspace));
  } else {
    return workspacePromise.then(workspace => {
      return {
        railsFile,
        workspace,
        in: function(callback) {
          if (railsFile) {
            return switchCallback(railsFile, workspace);
          } else {
            return Promise.resolve();
          }
        },
      };
    });
  }
}

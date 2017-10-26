import { getCurrentRailsFile, RailsFile } from './rails-file';
import { RailsWorkspaceCache, RailsWorkspace } from './rails-workspace';

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
  workspace: RailsWorkspace
) => Promise<T>;

export function getRailsContext<T>(callback?: InContextCallback<T>): Promise<T>;
export function getRailsContext(): Promise<RailsContext>;
export function getRailsContext(
  callback?: InContextCallback<any>
): Promise<any> {
  const railsFile = getCurrentRailsFile();
  const workspacePromise = RailsWorkspaceCache.fetch(railsFile.railsRoot);

  if (callback) {
    return workspacePromise.then(workspace => callback(railsFile, workspace));
  } else {
    return workspacePromise.then(workspace => {
      return {
        railsFile,
        workspace,
        in: function(callback) {
          if (railsFile) {
            return callback(railsFile, workspace);
          } else {
            return Promise.resolve();
          }
        },
      };
    });
  }
}

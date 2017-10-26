import * as fs from 'fs-extra';
import * as path from 'path';
import { RailsFile } from './rails-file';

/**
 * Some information about a Rails application at a given path.
 * 
 * @export
 * @class RailsWorkspace
 */
export class RailsWorkspace {
  private _knownFiles: { [index: string]: boolean } = {};

  constructor(private _path: string) {}

  get path(): string {
    return this._path;
  }

  get appPath(): string {
    return path.join(this.path, 'app');
  }

  get specPath(): string {
    return path.join(this.path, 'spec');
  }

  get testPath(): string {
    return path.join(this.path, 'tests');
  }

  get controllersPath(): string {
    return path.join(this.appPath, 'controllers');
  }

  get modelsPath(): string {
    return path.join(this.appPath, 'models');
  }

  get viewsPath(): string {
    return path.join(this.appPath, 'views');
  }

  async hasSpecs(): Promise<boolean> {
    return this.hasFile(this.specPath);
  }

  async hasTests(): Promise<boolean> {
    return this.hasFile(this.testPath);
  }

  async hasFile(path: string): Promise<boolean> {
    if (this._knownFiles[path]) {
      return true;
    }
    if (!path.startsWith(this.path)) {
      return false;
    }

    const exists = await fs.pathExists(path);
    if (exists) {
      this._knownFiles[path] = true;
    }

    return exists;
  }

  pathIn(filePath: string): boolean {
    return filePath.startsWith(this.path);
  }
}

interface _RailsWorkspaceCache {
  [index: string]: RailsWorkspace;
}

const cache: _RailsWorkspaceCache = {};

/**
 * A cache of rails workspaces.
 * 
 * @example
 * 
 *   const workspace = await RailsWorkspaceCache.fetch('/path/to/workspace');
 */
export const RailsWorkspaceCache = {
  async fetch(path: string): Promise<RailsWorkspace> {
    if (cache[path]) {
      return cache[path];
    }

    cache[path] = new RailsWorkspace(path);
    return cache[path];
  },
};

/**
 * Given a rails file, return it's location in the app/* directory of the
 * workspace.
 * 
 * This is useful for deriving the location of related files. For example,
 * 'app/models/subdir/model.rb', will translate to 'subdir/model.rb', and if
 * we're looking for a spec that becomes 'spec/subdir/model_spec.rb'`
 */
export function locationWithinAppLocation(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): string {
  return path
    .dirname(relativeToAppDir(railsFile, workspace))
    .split(path.sep)
    .slice(1)
    .join(path.sep);
}

/**
 * Get the relative path to the file from the workspace root
 */
export function relativeToAppDir(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): string {
  return path.relative(workspace.appPath, railsFile.filename);
}

/**
 * Get the view path of a controller
 */
export function getViewPath(railsFile: RailsFile, workspace: RailsWorkspace) {
  const justName = railsFile.basename
    .split('_')
    .slice(0, -1)
    .join('_');
  return path.join(
    workspace.viewsPath,
    locationWithinAppLocation(railsFile, workspace),
    justName
  );
}

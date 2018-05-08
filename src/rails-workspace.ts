import * as fs from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { RailsFile } from './rails-file';
import { appendWithoutExt } from './path-utils';

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
    const appDir = vscode.workspace.getConfiguration('rails').appDir || 'app';
    return path.resolve(this.path, appDir);
  }

  get specPath(): string {
    return path.join(this.path, 'spec');
  }

  get testPath(): string {
    return path.join(this.path, 'test');
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
  filename: string,
  workspace: RailsWorkspace
): string {
  return path
    .dirname(relativeToAppDir(workspace, filename))
    .split(path.sep)
    .slice(1)
    .join(path.sep);
}

export function relativeToRootDir(
  workspace: RailsWorkspace
): (filename: string) => string;
export function relativeToRootDir(
  workspace: RailsWorkspace,
  filename: string
): string;
export function relativeToRootDir(
  workspace: RailsWorkspace,
  filename?: string
) {
  if (!filename) {
    return filename => relativeToRootDir(workspace, filename);
  }
  return path.relative(workspace.path, filename);
}

/**
 * Get the relative path to the file from the workspace root
 */
export function relativeToAppDir(
  workspace: RailsWorkspace
): (filename: string) => string;
export function relativeToAppDir(
  workspace: RailsWorkspace,
  filename: string
): string;
export function relativeToAppDir(workspace: RailsWorkspace, filename?: string) {
  if (!filename) {
    return filename => relativeToAppDir(workspace, filename);
  }
  return path.relative(workspace.appPath, filename);
}

export async function getTestFile(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<string> {
  const specs = await workspace.hasSpecs();
  const fn = specs ? getSpecPath : getTestPath;
  return fn(railsFile, workspace);
}

export function getTestPath(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): string {
  const relFn = (railsFile.inApp ? relativeToAppDir : relativeToRootDir)(
    workspace
  );

  return path.join(
    workspace.specPath,
    appendWithoutExt(relFn(railsFile.filename), '_spec')
  );
}

export function getSpecPath(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): string {
  const relFn = (railsFile.inApp ? relativeToAppDir : relativeToRootDir)(
    workspace
  );

  return path.join(
    workspace.specPath,
    appendWithoutExt(relFn(railsFile.filename), '_spec')
  );
}

/**
 * Get the view path of a controller
 */
export function getViewPath(workspace:RailsWorkspace, railsFile: RailsFile) {
  const justName = railsFile.basename
    .split('_')
    .slice(0, -1)
    .join('_');
  return path.join(
    workspace.viewsPath,
    locationWithinAppLocation(railsFile.filename, workspace),
    justName
  );
}

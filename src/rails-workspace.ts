import * as fs from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import * as glob from 'glob';
import { RailsFile } from './rails-file';
import { appendWithoutExt } from './path-utils';
import {
  expandRailsAppRoots,
  clearRailsAppRootsCacheFor,
  clearRailsAppRootsCache,
} from './rails-app-roots';

/**
 * Some information about a Rails application at a given path.
 *
 * @export
 * @class RailsWorkspace
 */
export class RailsWorkspace {
  private _knownFiles: { [index: string]: boolean } = {};
  private _models: RailsFile[] | null = null;

  constructor(private _path: string) {}

  get path(): string {
    return this._path;
  }

  /** Primary app directory (top-level app preferred when present). */
  get appPath(): string {
    const roots = this.getExpandedAppRoots();
    if (roots.length > 0) {
      return roots[0];
    }
    const appDir = vscode.workspace.getConfiguration('rails').get('appDir', 'app');
    return path.resolve(this.path, appDir);
  }

  get specPath(): string {
    return path.join(this.path, 'spec');
  }

  get testPath(): string {
    return path.join(this.path, 'test');
  }

  getExpandedAppRoots(): string[] {
    return expandRailsAppRoots(this.path);
  }

  getCandidateSpecRoots(): string[] {
    const roots: string[] = [];
    const top = path.join(this.path, 'spec');
    if (fs.existsSync(top)) {
      roots.push(path.normalize(top));
    }
    for (const appRoot of this.getExpandedAppRoots()) {
      const local = path.join(path.dirname(appRoot), 'spec');
      if (fs.existsSync(local)) {
        const n = path.normalize(local);
        if (roots.indexOf(n) < 0) {
          roots.push(n);
        }
      }
    }
    return roots;
  }

  getCandidateTestRoots(): string[] {
    const roots: string[] = [];
    const top = path.join(this.path, 'test');
    if (fs.existsSync(top)) {
      roots.push(path.normalize(top));
    }
    for (const appRoot of this.getExpandedAppRoots()) {
      const local = path.join(path.dirname(appRoot), 'test');
      if (fs.existsSync(local)) {
        const n = path.normalize(local);
        if (roots.indexOf(n) < 0) {
          roots.push(n);
        }
      }
    }
    return roots;
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
    return Promise.resolve(this.getCandidateSpecRoots().length > 0);
  }

  async hasTests(): Promise<boolean> {
    return Promise.resolve(this.getCandidateTestRoots().length > 0);
  }

  async hasFile(pathToCheck: string): Promise<boolean> {
    if (this._knownFiles[pathToCheck]) {
      return true;
    }
    if (!pathToCheck.startsWith(this.path)) {
      return false;
    }

    const exists = await fs.pathExists(pathToCheck);
    if (exists) {
      this._knownFiles[pathToCheck] = true;
    }

    return exists;
  }

  pathIn(filePath: string): boolean {
    return filePath.startsWith(this.path);
  }

  async getModels() {
    if (this._models) return this._models;

    const seen = new Set<string>();
    const modelFiles: string[] = [];
    for (const appRoot of this.getExpandedAppRoots()) {
      const modelsDir = path.join(appRoot, 'models');
      if (!fs.existsSync(modelsDir)) {
        continue;
      }
      const found = await new Promise<string[]>((res, rej) =>
        glob(modelsDir + '/**/*.rb', (err, m) => {
          if (err) return rej(err);
          res(m);
        })
      );
      for (const f of found) {
        const n = path.normalize(f);
        if (!seen.has(n)) {
          seen.add(n);
          modelFiles.push(f);
        }
      }
    }

    this._models = modelFiles.map<RailsFile>(filename => {
      return new RailsFile(filename, '', []);
    });

    return this._models;
  }

  clearContentCache(): void {
    this._knownFiles = {};
    this._models = null;
  }

  clearCache() {
    this.clearContentCache();
    clearRailsAppRootsCacheFor(this.path);
  }
}

class RailsWorkspaceCacher {
  private _cache: { [index: string]: RailsWorkspace } = {};
  private _disposers: vscode.Disposable[] = [];

  invalidateAllWorkspaces(): void {
    clearRailsAppRootsCache();
    Object.keys(this._cache).forEach(k => this._cache[k].clearContentCache());
  }

  async fetch(workspacePath: string): Promise<RailsWorkspace> {
    if (this._cache[workspacePath]) {
      return this._cache[workspacePath];
    }

    const workspace = new RailsWorkspace(workspacePath);

    const watchGlobs: string[] = [];
    for (const appRoot of workspace.getExpandedAppRoots()) {
      watchGlobs.push(path.join(appRoot, '**/*.rb'));
      watchGlobs.push(path.join(appRoot, 'views', '**/*'));
    }
    for (const specRoot of workspace.getCandidateSpecRoots()) {
      watchGlobs.push(path.join(specRoot, '**/*.rb'));
    }
    for (const testRoot of workspace.getCandidateTestRoots()) {
      watchGlobs.push(path.join(testRoot, '**/*.rb'));
    }

    const watchers = watchGlobs.map(g =>
      vscode.workspace.createFileSystemWatcher(g, false, true)
    );

    watchers.forEach(watcher => {
      watcher.onDidCreate(() => workspace.clearCache());
      watcher.onDidDelete(() => workspace.clearCache());
      this._disposers.push(watcher);
    });

    this._cache[workspacePath] = workspace;
    return this._cache[workspacePath];
  }

  dispose() {
    this._disposers.forEach(d => d.dispose());
  }
}

/**
 * A cache of rails workspaces.
 *
 * @example
 *
 *   const workspace = await RailsWorkspaceCache.fetch('/path/to/workspace');
 */
export const RailsWorkspaceCache = new RailsWorkspaceCacher();

export function getEffectiveSpecRoot(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): string {
  if (railsFile.containingAppPath) {
    const local = path.join(path.dirname(railsFile.containingAppPath), 'spec');
    if (fs.existsSync(local)) {
      return local;
    }
  }
  return path.join(workspace.path, 'spec');
}

export function getEffectiveTestRoot(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): string {
  if (railsFile.containingAppPath) {
    const local = path.join(path.dirname(railsFile.containingAppPath), 'test');
    if (fs.existsSync(local)) {
      return local;
    }
  }
  return path.join(workspace.path, 'test');
}

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
  workspace: RailsWorkspace,
  appRoot?: string
): string {
  const base = appRoot || workspace.appPath;
  return path
    .dirname(path.relative(base, filename))
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
    return (fn: string) => relativeToRootDir(workspace, fn);
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
    return (fn: string) => relativeToAppDir(workspace, fn);
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
  const testRoot = getEffectiveTestRoot(railsFile, workspace);
  const appBase = railsFile.containingAppPath || workspace.appPath;
  const relFn = railsFile.inApp
    ? (fn: string) => path.relative(appBase, fn)
    : relativeToRootDir(workspace);

  return path.join(
    testRoot,
    appendWithoutExt(relFn(railsFile.filename), '_test')
  );
}

export function getSpecPath(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): string {
  const specRoot = getEffectiveSpecRoot(railsFile, workspace);
  const appBase = railsFile.containingAppPath || workspace.appPath;
  const relFn = railsFile.inApp
    ? (fn: string) => path.relative(appBase, fn)
    : relativeToRootDir(workspace);

  return path.join(
    specRoot,
    appendWithoutExt(relFn(railsFile.filename), '_spec')
  );
}

/**
 * Get the view path of a controller
 */
export function getViewPath(workspace: RailsWorkspace, railsFile: RailsFile) {
  const justName = railsFile.basename
    .split('_')
    .slice(0, -1)
    .join('_');
  const appRoot = railsFile.containingAppPath || workspace.appPath;
  const viewsPath = path.join(appRoot, 'views');
  return path.join(
    viewsPath,
    locationWithinAppLocation(railsFile.filename, workspace, appRoot),
    justName
  );
}

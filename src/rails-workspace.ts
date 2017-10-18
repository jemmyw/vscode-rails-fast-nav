import * as fs from 'fs-extra';
import * as path from 'path';
import { RailsFile } from './rails-file';

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

export const RailsWorkspaceCache = {
  async fetch(path: string): Promise<RailsWorkspace> {
    if (cache[path]) {
      return cache[path];
    }

    cache[path] = new RailsWorkspace(path);
    return cache[path];
  },
};

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

export function relativeToAppDir(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): string {
  return path.relative(workspace.appPath, railsFile.filename);
}

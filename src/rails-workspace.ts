import * as fs from 'fs-extra';
import * as path from 'path';

export class RailsWorkspace {
  private _hasSpecs: boolean;
  private _hasTests: boolean;
  private _knownFiles: { [index: string]: boolean } = {};

  constructor(private _path: string) {}

  get path(): string {
    return this._path;
  }

  get appPath(): string {
    return path.join(this.path, 'app');
  }

  get specPath(): string {
    return path.join(this.path, 'specs');
  }
  get testPath(): string {
    return path.join(this.path, 'tests');
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

import * as path from 'path';
import * as fs from 'fs-extra';
import * as vscode from 'vscode';
import { getAllMethodNames, getLastMethodName } from './ruby-methods';

function isRailsRoot(filename: string): boolean {
  const railsBin = path.join(filename, 'bin', 'rails');
  const railsScript = path.join(filename, 'script', 'rails');
  return fs.existsSync(railsBin) || fs.existsSync(railsScript);
}

function getRailsRoot(filename: string): string {
  const dir = path.dirname(filename);

  if (isRailsRoot(dir)) {
    return dir;
  } else {
    return getRailsRoot(dir);
  }
}

export class RailsFile {
  private _parsed: path.ParsedPath;
  private _railsRoot: string;
  private _inApp: boolean;

  constructor(
    private _filename: string,
    private _methodName: string,
    private _methods: string[]
  ) {
    this._parsed = path.parse(this._filename);
    this._railsRoot = getRailsRoot(this._parsed.dir);
    this._inApp = path
      .relative(this._railsRoot, _filename)
      .startsWith('app' + path.sep);
  }

  get filename(): string {
    return this._filename;
  }
  get dirname(): string {
    return this._parsed.dir;
  }
  get basename(): string {
    return this._parsed.base;
  }
  get ext(): string {
    return this._parsed.ext;
  }
  get inApp(): boolean {
    return this._inApp;
  }
  get railsRoot(): string {
    return this._railsRoot;
  }

  get fileType(): string {
    if (!this._inApp) {
      if (this._parsed.name.endsWith('_spec')) {
        return 'spec';
      }

      if (this._parsed.name.endsWith('_test')) {
        return 'test';
      }

      if (this._parsed.ext === '.rb') {
        return 'unknown_ruby';
      }
      if (this._parsed.ext === '.erb') {
        return 'unknown_erb';
      }
      return 'unknown';
    }

    const rel: string = path.relative(
      path.join(this._railsRoot, 'app'),
      this._filename
    );
    return rel.split(path.sep)[0];
  }

  get methodName(): string {
    return this._methodName;
  }
  get methods(): string[] {
    return this._methods;
  }

  isInAppDir(dir:string) { return this.fileType === dir; }
  isController() { return this.isInAppDir('controllers'); }
  isModel() { return this.isInAppDir('models'); }
  isView() { return this.isInAppDir('views'); }
  isTest() {
    return this.fileType === 'spec' || this.fileType === 'test';
  }
}

export function getCurrentRailsFile(): RailsFile {
  const editor = vscode.window.activeTextEditor;
  const activeSelection = editor.selection.active;
  const filename = editor.document.fileName;

  return new RailsFile(
    filename,
    getLastMethodName(editor.document, activeSelection.line),
    getAllMethodNames(editor.document)
  );
}

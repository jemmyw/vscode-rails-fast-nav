import * as path from 'path';
import * as fs from 'fs-extra';
import * as vscode from 'vscode';
import { getAllMethodNames, getLastMethodName } from './ruby-methods';
import { classify } from 'inflected';
import { singularize } from 'inflected';

function isRailsRoot(filename: string): boolean {
  const railsBin = path.join(filename, 'bin', 'rails');
  const railsScript = path.join(filename, 'script', 'rails');
  return fs.existsSync(railsBin) || fs.existsSync(railsScript);
}

function getRailsRoot(filename: string): string | null {
  const dir = path.dirname(filename);
  if (dir === filename) return null;

  if (isRailsRoot(dir)) {
    return dir;
  } else {
    return getRailsRoot(dir);
  }
}

/**
 * Information about the file that is currently open in the editor.
 */
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

  get classname(): string {
    return classify(this.withoutExt);
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
  get withoutExt(): string {
    return path.basename(this._filename, this._parsed.ext);
  }
  get ext(): string {
    return this._parsed.ext;
  }
  get inApp(): boolean {
    return this._inApp;
  }
  get module(): string {
    const rel: string = path.relative(this._railsRoot, this._filename);
    return rel
      .split(path.sep)
      .slice(2, this.isView() ? -2 : -1)
      .join(path.sep);
  }
  possibleModelNames(): string[] {
    if (this.isModel()) return [this.withoutExt];
    if (this.isView()) return [singularize(path.basename(this.dirname))];
    if (this.isFixture()) return [singularize(this.withoutExt)];

    const parts = this.withoutExt.split('_');

    if (this.isTest()) {
      return [
        singularize(parts.slice(0, -2).join('_')),
        singularize(parts.slice(0, -3).join('_')),
      ];
    }
    return [singularize(parts.slice(0, -1).join('_'))];
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

      if (this.dirname.endsWith('fixtures')) {
        return 'fixture';
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

  isInAppDir(dir: string) {
    return this.fileType === dir;
  }
  isController() {
    return this.isInAppDir('controllers');
  }
  isModel() {
    return this.isInAppDir('models');
  }
  isView() {
    return this.isInAppDir('views');
  }
  isTest() {
    return this.fileType === 'spec' || this.fileType === 'test';
  }
  isFixture() {
    return this.fileType === 'fixture';
  }
}

/**
 * Turn the current active editor into a RailsFile instance
 */
export function getCurrentRailsFile(): RailsFile | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }

  const activeSelection = editor.selection.active;
  const filename = editor.document.fileName;

  if (!getRailsRoot(filename)) return null;

  return new RailsFile(
    filename,
    getLastMethodName(editor.document, activeSelection.line),
    getAllMethodNames(editor.document)
  );
}

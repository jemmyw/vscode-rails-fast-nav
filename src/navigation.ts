import * as vscode from 'vscode';
import Uri from 'vscode-uri';
import { CurrentRailsFile } from './types';
import * as path from 'path';
import * as fs from 'fs';
import { getCheckedSwitches } from './switches';

const defReg = /def\s+(\w+)/g;
const appFile = /^app\/([^\/]+)\/.*/;

function getLastMethodName(
  document: vscode.TextDocument,
  line: number
): string | null {
  for (let i = line; i >= 0; i--) {
    const line = document.lineAt(i);
    const matches = defReg.exec(line.text);

    if (matches) {
      return matches[1];
    }
  }
}

function getAllMethodNames(document: vscode.TextDocument): string[] {
  const text = document.getText();
  const names: string[] = [];
  let match;

  while ((match = defReg.exec(text))) {
    names.push(match[1]);
  }

  return names;
}

function isRailsRoot(filename: string): boolean {
  const appPath = path.join(filename, 'app');
  const appRbPath = path.join(filename, 'config', 'application.rb');
  return fs.existsSync(appPath) && fs.existsSync(appRbPath);
}

function getRailsRoot(filename: string): string {
  const dir = path.dirname(filename);

  if (isRailsRoot(dir)) {
    return dir;
  } else {
    return getRailsRoot(dir);
  }
}

function getRelativeFile(root: string, filename: string): string {
  return filename.slice(root.length + 1);
}

function getFileType(filename: string): string {
  const appMatch = filename.match(appFile);

  if (appMatch) {
    return appMatch[1];
  } else if (filename.endsWith('.rb')) {
    return 'unknown_ruby';
  } else if (filename.endsWith('.erb')) {
    return 'unknown_erb';
  } else {
    return 'unknown';
  }
}
function getCurrentRailsFile(): CurrentRailsFile {
  const editor = vscode.window.activeTextEditor;
  const activeSelection = editor.selection.active;
  const railsRoot = getRailsRoot(editor.document.fileName);
  const filename = editor.document.fileName;

  return {
    railsRoot,
    filename,
    basename: path.basename(filename),
    dirname: path.dirname(filename),
    inApp: path.relative(railsRoot, filename).startsWith('app' + path.sep),
    fileType: getFileType(filename),
    methodName: getLastMethodName(editor.document, activeSelection.line),
    methods: getAllMethodNames(editor.document),
  };
}

interface IndexedQuickPickItem extends vscode.QuickPickItem {
  index: number;
}

export async function navigateRails() {
  try {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const railsFile = getCurrentRailsFile();
    const switchableFiles = await getCheckedSwitches(railsFile);
    const quickPickItems: IndexedQuickPickItem[] = switchableFiles.map(
      (file, index): IndexedQuickPickItem => ({
        label: file.title,
        description: '',
        detail: path.relative(railsFile.railsRoot, file.filename),
        index,
      })
    );

    const picked: IndexedQuickPickItem = await vscode.window.showQuickPick(
      quickPickItems
    );

    if (picked) {
      const switchFile = switchableFiles[picked.index];
      const uri = Uri.parse('file://' + switchFile.filename);
      return await vscode.workspace
        .openTextDocument(switchFile.filename)
        .then(vscode.window.showTextDocument);
    }
  } catch (err) {
    console.error(err);
  }
}

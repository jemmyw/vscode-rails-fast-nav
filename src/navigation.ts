import * as vscode from 'vscode';
import * as path from 'path';
import { getCheckedSwitches } from './switches';
import { RailsFile } from './rails-file';
import { getAllMethodNames, getLastMethodName } from './ruby-methods';

function getCurrentRailsFile(): RailsFile {
  const editor = vscode.window.activeTextEditor;
  const activeSelection = editor.selection.active;
  const filename = editor.document.fileName;

  return new RailsFile(
    filename,
    getLastMethodName(editor.document, activeSelection.line),
    getAllMethodNames(editor.document)
  );
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
      return await vscode.workspace
        .openTextDocument(switchFile.filename)
        .then(vscode.window.showTextDocument);
    }
  } catch (err) {
    console.error(err);
  }
}

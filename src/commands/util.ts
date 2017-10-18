import * as vscode from 'vscode';
import * as path from 'path';
import { SwitchFile, OrPromise } from '../types';

interface IndexedQuickPickItem extends vscode.QuickPickItem {
  index: number;
}

export function openFile(filename: string) {
  return vscode.workspace
    .openTextDocument(filename)
    .then(vscode.window.showTextDocument);
}

async function quickPickItems(root:string, switchFiles:OrPromise<SwitchFile[]>):Promise<IndexedQuickPickItem[]> {
  return (await Promise.resolve(switchFiles)).map(
    (file, index): IndexedQuickPickItem => ({
      label: file.title,
      description: '',
      detail: path.relative(root, file.filename),
      index,
    })
  );
}

export async function showPicker(
  root: string,
  switchFiles: OrPromise<SwitchFile[]>
) {
  const picked: IndexedQuickPickItem = await vscode.window.showQuickPick(
    quickPickItems(root, switchFiles)
  );

  if (picked) {
    const switchFile = switchFiles[picked.index];
    await openFile(switchFile.filename);
    return switchFile;
  }
}

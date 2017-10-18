import * as vscode from 'vscode';
import * as path from 'path';
import { getCurrentRailsFile } from '../rails-file';
import { viewMaker } from '../makers';
import { getSwitchesFromRule } from '../switches';
import { openFile, showPicker } from './util';

function isCurrentMethodView(methodName: string, filename: string): boolean {
  const viewName = path.basename(filename).split('.')[0];
  return viewName === methodName;
}

export async function switchToView() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const railsFile = getCurrentRailsFile();
  if (!railsFile.isController()) {
    return;
  }

  const switchFiles = await getSwitchesFromRule(viewMaker, railsFile);

  if (switchFiles.length === 0) {
    return await vscode.window.showInformationMessage(
      'No view found for this controller / action'
    );
  }

  if (
    switchFiles.length === 1 ||
    isCurrentMethodView(railsFile.methodName, switchFiles[0].filename)
  ) {
    return openFile(switchFiles[0].filename);
  } else {
    return showPicker(railsFile.railsRoot, switchFiles);
  }
}

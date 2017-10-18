import * as vscode from 'vscode';
import { getCurrentRailsFile } from '../rails-file';
import { modelMaker } from '../makers';
import { getSwitchesFromRule } from '../switches';
import { openFile, showPicker } from './util';

export async function switchToModel() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const railsFile = getCurrentRailsFile();
  if (railsFile.isModel()) {
    return;
  }

  const switchFiles = await getSwitchesFromRule(modelMaker, railsFile);

  if (switchFiles.length === 0) {
    return await vscode.window.showInformationMessage(
      'No model found for this file'
    );
  }

  if (switchFiles.length === 1) {
    return openFile(switchFiles[0].filename);
  } else {
    return showPicker(railsFile.railsRoot, switchFiles);
  }
}

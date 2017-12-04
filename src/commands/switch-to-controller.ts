import * as vscode from 'vscode';
import { getCurrentRailsFile } from '../rails-file';
import { controllerMaker } from '../makers';
import { getSwitchesFromRule } from '../switches';
import { openFile, showPicker } from './util';

export async function switchToController() {
  const railsFile = getCurrentRailsFile();
  if (!railsFile) {
    return;
  }

  if (railsFile.isController()) {
    return;
  }

  const switchFiles = await getSwitchesFromRule(controllerMaker, railsFile);

  if (switchFiles.length === 0) {
    return await vscode.window.showInformationMessage(
      'No controller found for this file'
    );
  }

  if (switchFiles.length === 1) {
    return openFile(switchFiles[0].filename);
  } else {
    return showPicker(railsFile.railsRoot, switchFiles);
  }
}

import * as vscode from 'vscode';
import { getCurrentRailsFile } from '../rails-file';
import { grapeApiMaker } from '../makers';
import { getSwitchesFromRule } from '../switches';
import { openFile, showPicker } from './util';

export async function switchToGrapeApi() {
  const railsFile = getCurrentRailsFile();
  if (!railsFile) {
    return await vscode.window.showInformationMessage(
      'This is not a rails file'
    );
  }
  if (railsFile.isGrapeApi()) {
    return await vscode.window.showInformationMessage(
      'This is in grape api'
    );
  }

  const switchFiles = await getSwitchesFromRule(grapeApiMaker, railsFile);

  if (switchFiles.length === 0) {
    return await vscode.window.showInformationMessage(
      'No grape api found for this file'
    );
  }

  if (switchFiles.length === 1) {
    return openFile(switchFiles[0].filename);
  } else {
    return showPicker(railsFile.railsRoot, switchFiles);
  }
}

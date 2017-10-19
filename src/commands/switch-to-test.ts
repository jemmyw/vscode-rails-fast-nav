import * as vscode from 'vscode';
import { getCurrentRailsFile } from '../rails-file';
import { testMaker, specMaker } from '../makers';
import { getSwitchesFromRules } from '../switches';
import { openFile, showPicker } from './util';

export async function switchToTest() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const railsFile = getCurrentRailsFile();
  if (railsFile.isTest()) {
    return;
  }

  const switchFiles = await getSwitchesFromRules(
    [testMaker, specMaker],
    railsFile
  );

  if (switchFiles.length === 0) {
    return await vscode.window.showInformationMessage('No test or spec found');
  }

  if (switchFiles.length === 1) {
    return openFile(switchFiles[0].filename);
  } else {
    return showPicker(railsFile.railsRoot, switchFiles);
  }
}

import * as vscode from 'vscode';
import { getRailsContext } from '../rails-context';
import { getSwitchesFromRules, checkSwitchFiles } from '../switches';
import { fixtureMaker } from '../makers';
import { openFile, showPicker, showCreateFile } from './util';

export async function switchToFixture() {
  return getRailsContext(async function(railsFile, workspace) {
    const switchFiles = await getSwitchesFromRules(
      [fixtureMaker],
      railsFile,
      false
    );
    const checked = await checkSwitchFiles(switchFiles);

    switch (checked.length) {
      case 0: {
        if (switchFiles.length === 0) {
          return await vscode.window.showInformationMessage(
            'No fixture found for this file'
          );
        } else {
          return await showCreateFile(switchFiles[0].filename);
        }
      }
      case 1: {
        return openFile(switchFiles[0].filename);
      }
      default: {
        return showPicker(railsFile.railsRoot, switchFiles);
      }
    }
  });
}

import * as vscode from 'vscode';
import { getRailsContext } from '../rails-context';
import { testMaker, specMaker } from '../makers';
import { openFile, showPicker } from './util';
import { getTestFile, relativeToRootDir } from '../rails-workspace';
import { ensureDocument } from '../path-utils';

export async function switchToTest() {
  return getRailsContext([testMaker, specMaker], async function(railsFile, workspace, switchFiles) {
    if (railsFile.isTest()) {
      return;
    }

    if (switchFiles.length === 0) {
      const yesItem: vscode.MessageItem = {
        title: 'Yes',
      };
      const noItem: vscode.MessageItem = {
        title: 'No',
        isCloseAffordance: true,
      };

      const testFilePath = await getTestFile(railsFile, workspace);
      const testFileDisplay = relativeToRootDir(workspace, testFilePath);

      const response = await vscode.window.showInformationMessage(
        `Create ${testFileDisplay}?`,
        yesItem,
        noItem
      );
      if (response === yesItem) {
        return await ensureDocument(testFilePath);
      }
    }

    if (switchFiles.length === 1) {
      return openFile(switchFiles[0].filename);
    } else {
      return showPicker(railsFile.railsRoot, switchFiles);
    }
  });
}

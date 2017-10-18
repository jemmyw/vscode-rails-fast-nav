import * as vscode from 'vscode';
import { getCheckedSwitches } from '../switches';
import { getCurrentRailsFile } from '../rails-file';
import { showPicker } from './util';

export async function navigateRails() {
  try {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const railsFile = getCurrentRailsFile();
    const switchableFiles = await getCheckedSwitches(railsFile);

    return await showPicker(railsFile.railsRoot, switchableFiles);
  } catch (err) {
    console.error(err);
  }
}

import * as path from 'path';
import { getRailsContext } from '../rails-context';
import { viewMaker } from '../makers';
import { getSwitchesFromRule } from '../switches';
import { openFile, showPicker } from './util';
import { createView } from './create-view';

function isCurrentMethodView(methodName: string, filename: string): boolean {
  const viewName = path.basename(filename).split('.')[0];
  return viewName === methodName;
}

export function switchToView(): Promise<void> {
  return getRailsContext(async function(railsFile, workspace) {
    if (!railsFile.isController()) {
      return;
    }

    const switchFiles = await getSwitchesFromRule(viewMaker, railsFile);

    if (switchFiles.length === 0) {
      return await createView();
    }

    if (
      switchFiles.length === 1 ||
      isCurrentMethodView(railsFile.methodName, switchFiles[0].filename)
    ) {
      return openFile(switchFiles[0].filename);
    } else {
      return showPicker(railsFile.railsRoot, switchFiles);
    }
  });
}

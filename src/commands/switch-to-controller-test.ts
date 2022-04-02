import { getRailsContext } from '../rails-context';
import { controllerTestMaker, inverseTestMaker } from '../makers';
import { openFile, showPicker, showCreateFile } from './util';
import { getControllerTestFile } from '../rails-workspace';

export async function switchToControllerTest() {
  return getRailsContext([controllerTestMaker, inverseTestMaker], async function(railsFile, workspace, switchFiles) {
    if (railsFile.isControllerTest()) {
      if (switchFiles.length > 0) {
        return openFile(switchFiles[0].filename);
      }
    }

    if (switchFiles.length === 0) {
      const controllerTestFilePath = await getControllerTestFile(railsFile, workspace);
      return await showCreateFile(controllerTestFilePath);
    }

    if (switchFiles.length === 1) {
      return openFile(switchFiles[0].filename);
    } else {
      return showPicker(railsFile.railsRoot, switchFiles);
    }
  });
}

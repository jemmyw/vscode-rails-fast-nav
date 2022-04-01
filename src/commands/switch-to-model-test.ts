import { getRailsContext } from '../rails-context';
import { modelTestMaker, inverseTestMaker } from '../makers';
import { openFile, showPicker, showCreateFile } from './util';
import { getModelTestFile } from '../rails-workspace';

export async function switchToModelTest() {
  return getRailsContext([modelTestMaker, inverseTestMaker], async function(railsFile, workspace, switchFiles) {
    if (railsFile.isModelTest()) {
      if (switchFiles.length > 0) {
        return openFile(switchFiles[0].filename);
      }
    }

    if (switchFiles.length === 0) {
      const modelTestFilePath = await getModelTestFile(railsFile, workspace);
      return await showCreateFile(modelTestFilePath);
    }

    if (switchFiles.length === 1) {
      return openFile(switchFiles[0].filename);
    } else {
      return showPicker(railsFile.railsRoot, switchFiles);
    }
  });
}

import { getRailsContext } from '../rails-context';
import { testMaker, specMaker, inverseTestMaker } from '../makers';
import { openFile, showPicker, showCreateFile } from './util';
import { getTestFile } from '../rails-workspace';

export async function switchToTest() {
  return getRailsContext([testMaker, specMaker, inverseTestMaker], async function(railsFile, workspace, switchFiles) {
    if (railsFile.isTest()) {
      if (switchFiles.length > 0) {
        return openFile(switchFiles[0].filename);
      }
    }

    if (switchFiles.length === 0) {
      const testFilePath = await getTestFile(railsFile, workspace);
      return await showCreateFile(testFilePath);
    }

    if (switchFiles.length === 1) {
      return openFile(switchFiles[0].filename);
    } else {
      return showPicker(railsFile.railsRoot, switchFiles);
    }
  });
}

import { getCheckedSwitches } from '../switches';
import { getCurrentRailsFile } from '../rails-file';
import { showPicker } from './util';

export async function navigateRails() {
  try {
    const railsFile = getCurrentRailsFile();
    if (!railsFile) {
      return;
    }
    const switchableFiles = await getCheckedSwitches(railsFile);

    return await showPicker(railsFile.railsRoot, switchableFiles);
  } catch (err) {
    console.error(err);
  }
}

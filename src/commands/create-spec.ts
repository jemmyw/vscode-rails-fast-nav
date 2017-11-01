import { getSpecPath } from '../rails-workspace';
import { getRailsContext } from '../rails-context';
import { ensureDocument } from '../path-utils';

export async function createSpec() {
  return getRailsContext(async function(railsFile, workspace) {
    if (railsFile.isTest()) {
      return;
    }

    return await ensureDocument(getSpecPath(railsFile, workspace));
  });
}

import { factoryMaker } from '../makers';
import { getRailsContext } from '../rails-context';
import { ensureDocument } from '../path-utils';

export async function createFactory() {
  return getRailsContext(async function(railsFile, workspace) {
    const [factory] = await factoryMaker(railsFile, workspace);

    if (!factory) {
      return;
    }

    return await ensureDocument(factory.filename);
  });
}

import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import {
  RailsWorkspace,
  getEffectiveSpecRoot,
  getEffectiveTestRoot,
} from '../rails-workspace';
import { pluralize } from 'inflected';
import * as path from 'path';

export async function factoryMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const hasSpecs = await workspace.hasSpecs();
  const baseRoot = hasSpecs
    ? getEffectiveSpecRoot(railsFile, workspace)
    : getEffectiveTestRoot(railsFile, workspace);
  const factoriesPath = path.join(baseRoot, 'factories');

  return railsFile.possibleModelNames().map(modelName => {
    const relParts = [railsFile.module, pluralize(modelName) + '.rb'].filter(
      p => p.length > 0
    );
    const filename = path.join(factoriesPath, ...relParts);

    return {
      filename,
      title: 'Factory ' + path.basename(filename),
      type: 'factory',
    };
  });
}

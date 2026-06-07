import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import {
  RailsWorkspace,
  getEffectiveSpecRoot,
  getEffectiveTestRoot,
} from '../rails-workspace';
import { pluralize } from 'inflected';
import * as path from 'path';

export async function fixtureMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const hasSpecs = await workspace.hasSpecs();
  const baseRoot = hasSpecs
    ? getEffectiveSpecRoot(railsFile, workspace)
    : getEffectiveTestRoot(railsFile, workspace);
  const fixturesPath = path.join(baseRoot, 'fixtures');

  return railsFile.possibleModelNames().map(modelName => {
    const basename =
      railsFile.module.replace(path.sep, '_') +
      '_' +
      pluralize(modelName) +
      '.yml';

    return {
      filename: path.join(fixturesPath, basename),
      title: 'Fixture ' + basename,
      type: 'fixture',
    };
  });
}

import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace } from '../rails-workspace';
import { pluralize } from 'inflected';
import * as path from 'path';

export async function fixtureMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const hasSpecs = await workspace.hasSpecs();
  const fixturesPath = path.join(
    hasSpecs ? workspace.specPath : workspace.testPath,
    'fixtures'
  );

  return railsFile.possibleModelNames().map(modelName => {
    const basename =
      railsFile.module.replace(path.sep, '_') +
      pluralize(modelName) +
      '.yml';

    return {
      filename: path.join(fixturesPath, basename),
      title: 'Fixture ' + basename,
      type: 'fixture',
    };
  });
}

import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace } from '../rails-workspace';
import { pluralize } from 'inflected';
import * as path from 'path';

function justName(railsFile: RailsFile) {
  if (railsFile.isView()) {
    return path.basename(railsFile.dirname);
  } else {
    return railsFile.basename
      .split('_')
      .slice(0, railsFile.isTest() ? -2 : -1)
      .join('_');
  }
}

export async function fixtureMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const pluralName = pluralize(justName(railsFile));
  const hasSpecs = await workspace.hasSpecs();
  const fixtureFilename = path.join(
    hasSpecs ? workspace.specPath : workspace.testPath,
    'fixtures',
    pluralName + '.yml'
  );

  return [
    {
      filename: fixtureFilename,
      title: 'Fixture ' + pluralName + '.yml',
      type: 'fixture',
    },
  ];
}

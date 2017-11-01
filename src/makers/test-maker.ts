import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace, relativeToAppDir } from '../rails-workspace';
import { appendWithoutExt } from '../path-utils';
import * as path from 'path';

export function testMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): SwitchFile[] {
  return [{
    filename: path.join(
      workspace.testPath,
      appendWithoutExt(relativeToAppDir(workspace, railsFile.filename), '_test')
    ),
    title: 'Test file',
    type: 'test',
  }];
}

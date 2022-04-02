import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace, relativeToAppDir } from '../rails-workspace';
import { appendWithoutExt } from '../path-utils';
import * as path from 'path';

export function modelTestMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): SwitchFile[] {
  return [
    {
      filename: path.join(
        workspace.modelTestPath,
        appendWithoutExt(relativeToAppDir(workspace, railsFile.filename), '_test')
      ),
      title: 'Model test file',
      type: 'modelTest',
    },
  ];
}

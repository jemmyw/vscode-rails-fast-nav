import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace, relativeToAppDir } from '../rails-workspace';
import { appendWithoutExt } from '../path-utils';
import * as path from 'path';

export function controllerTestMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): SwitchFile[] {
  return [
    {
      filename: path.join(
        workspace.controllerTestPath,
        appendWithoutExt(relativeToAppDir(workspace, railsFile.filename), '_test')
      ),
      title: 'Controller test file',
      type: 'controllerTest',
    },
  ];
}

import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace, relativeToAppDir } from '../rails-workspace';
import { appendWithoutExt } from '../path-utils';
import * as path from 'path';

export function specMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): SwitchFile[] {
  return [
    {
      filename: path.join(
        workspace.specPath,
        appendWithoutExt(relativeToAppDir(workspace, railsFile.filename), '_spec')
      ),
      title: 'Spec file',
      type: 'spec',
    },
  ];
}

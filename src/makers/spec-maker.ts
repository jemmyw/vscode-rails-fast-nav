import { RailsFile, SwitchFile } from '../types';
import { RailsWorkspace, relativeToAppDir } from '../rails-workspace';
import {appendWithoutExt} from '../path-utils';
import * as path from 'path';

export function specMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): SwitchFile {
  return {
    filename: path.join(
      workspace.specPath,
      appendWithoutExt(relativeToAppDir(railsFile, workspace), '_spec')
    ),
    title: 'Spec file',
    type: 'spec',
  };
}

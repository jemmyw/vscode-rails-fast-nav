import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace, getSpecPath } from '../rails-workspace';

export function specMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): SwitchFile[] {
  return [
    {
      filename: getSpecPath(railsFile, workspace),
      title: 'Spec file',
      type: 'spec',
    },
  ];
}

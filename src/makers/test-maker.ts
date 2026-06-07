import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace, getTestPath } from '../rails-workspace';

export function testMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): SwitchFile[] {
  return [
    {
      filename: getTestPath(railsFile, workspace),
      title: 'Test file',
      type: 'test',
    },
  ];
}

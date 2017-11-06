import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace } from '../rails-workspace';
import * as path from 'path';

function inTestDir(workspace: RailsWorkspace, filename: string) {
  return !path.relative(workspace.testPath, filename).startsWith('..');
}

function inSpecDir(workspace: RailsWorkspace, filename: string) {
  return !path.relative(workspace.specPath, filename).startsWith('..');
}

function relativeToTestDir(
  workspace: RailsWorkspace,
  filename: string
): string {
  if (inTestDir(workspace, filename)) {
    return path.relative(workspace.testPath, filename);
  } else if (inSpecDir(workspace, filename)) {
    return path.relative(workspace.specPath, filename);
  }
}

export function inverseTestMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): SwitchFile[] {
  if (!railsFile.isTest()) {
    return [];
  }

  const basename = railsFile.basename.replace(/_(spec|test)/, '');
  const relativeFilename = relativeToTestDir(workspace, railsFile.filename);
  if (!relativeFilename) {
    return [];
  }
  const relativePath = path.dirname(relativeFilename);

  return [
    {
      filename: path.join(workspace.appPath, relativePath, basename),
      title: 'File',
      type: 'file',
    },
    {
      filename: path.join(workspace.path, relativePath, basename),
      title: 'File',
      type: 'file',
    },
  ];
}

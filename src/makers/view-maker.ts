import { RailsFile, SwitchFile } from '../types';
import { RailsWorkspace, locationWithinAppLocation } from '../rails-workspace';
import * as path from 'path';
import * as vscode from 'vscode';

export async function viewMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const justName = railsFile.basename
    .split('_')
    .slice(0, -1)
    .join('_');
  const viewPath = path.relative(
    workspace.path,
    path.join(
      workspace.viewsPath,
      locationWithinAppLocation(railsFile, workspace),
      justName
    )
  );

  const methods = railsFile.methods.sort((a, b) => {
    if (a === railsFile.methodName) {
      return -1;
    }
    return 0;
  });

  return await Promise.all(
    methods.map(methodName =>
      vscode.workspace
        .findFiles(path.join(viewPath, methodName + '*'), null, 10)
        .then(files =>
          files.map((file: vscode.Uri): SwitchFile => ({
            checkedExists: true,
            filename: file.fsPath,
            title: 'View ' + path.basename(file.fsPath),
            type: 'view',
          }))
        )
    )
  ).then((allViews: SwitchFile[][]): SwitchFile[] => {
    return [].concat(...allViews);
  });
}

import { RailsFile } from '../rails-file';
import { RailsWorkspace } from '../rails-workspace';
import { SwitchFile } from '../types';
import { pluralize } from 'inflected';
import * as path from 'path';
import * as vscode from 'vscode';

export async function controllerMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  if (railsFile.isView()) {
    const controllerName =
      path.basename(path.dirname(railsFile.filename)) + '_controller.rb';

    return [
      {
        filename: path.join(workspace.controllersPath, controllerName),
        title: 'Controller',
        type: 'controller',
      },
    ];
  } else if (railsFile.isModel()) {
    const controllerName = pluralize(
      path.basename(railsFile.filename, path.extname(railsFile.filename)) +
        '_controller.rb'
    );

    return await vscode.workspace
      .findFiles(
        path.relative(
          workspace.path,
          path.join(workspace.controllersPath, '**', controllerName)
        ),
        null,
        10
      )
      .then(files =>
        files.map(file => ({
          checkedExists: true,
          filename: file.fsPath,
          title: 'Controller ' + controllerName,
          type: 'controller',
        }))
      );
  }

  return [];
}

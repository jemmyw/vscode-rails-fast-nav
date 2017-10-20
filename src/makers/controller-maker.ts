import { RailsFile } from '../rails-file';
import { RailsWorkspace } from '../rails-workspace';
import { SwitchFile } from '../types';
import { pluralize } from 'inflected';
import * as path from 'path';

function getControllerNameFromView(railsFile): string {
  return path.basename(path.dirname(railsFile.filename)) + '_controller.rb';
}

function getControllerNameFromModel(railsFile): string {
  return (
    pluralize(
      path.basename(railsFile.filename, path.extname(railsFile.filename))
    ) + '_controller.rb'
  );
}

function getControllerName(railsFile: RailsFile): string {
  if (railsFile.isView()) {
    return getControllerNameFromView(railsFile);
  } else {
    return getControllerNameFromModel(railsFile);
  }
}

export async function controllerMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const controllerName = getControllerName(railsFile);

  if (controllerName) {
    return [
      {
        checkedExists: false,
        filename: path.join(workspace.controllersPath, controllerName),
        title: 'Controller ' + controllerName,
        type: 'controller',
      },
    ];
  }

  return [];
}

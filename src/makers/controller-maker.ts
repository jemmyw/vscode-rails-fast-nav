import { RailsFile } from '../rails-file';
import { RailsWorkspace, locationWithinAppLocation } from '../rails-workspace';
import { SwitchFile } from '../types';
import { pluralize } from 'inflected';
import * as path from 'path';

function getControllerNameFromView(railsFile:RailsFile, workspace:RailsWorkspace): string {
  const location = locationWithinAppLocation(path.dirname(railsFile.filename), workspace);
  const controllerName = path.basename(path.dirname(railsFile.filename)) + '_controller.rb';
  return path.join(location, controllerName);
}

function getControllerNameFromModel(railsFile): string {
  return (
    pluralize(
      path.basename(railsFile.filename, path.extname(railsFile.filename))
    ) + '_controller.rb'
  );
}

function getControllerName(railsFile: RailsFile, workspace:RailsWorkspace): string {
  if (railsFile.isView()) {
    return getControllerNameFromView(railsFile, workspace);
  } else {
    return getControllerNameFromModel(railsFile);
  }
}

export async function controllerMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const controllerName = getControllerName(railsFile, workspace);

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

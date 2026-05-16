import { RailsFile } from '../rails-file';
import { RailsWorkspace } from '../rails-workspace';
import { SwitchFile } from '../types';
import { pluralize } from 'inflected';
import * as path from 'path';

export async function controllerMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const appRoot = railsFile.containingAppPath || workspace.appPath;
  const controllersPath = path.join(appRoot, 'controllers');
  return railsFile.possibleModelNames().map(possibleModelName => {
    const controllerName = pluralize(possibleModelName) + '_controller.rb';
    return {
      checkedExists: false,
      filename: path.join(
        controllersPath,
        railsFile.module,
        controllerName
      ),
      title: 'Controller ' + controllerName,
      type: 'controller',
    };
  });
}

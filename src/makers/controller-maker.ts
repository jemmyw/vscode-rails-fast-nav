import { RailsFile } from '../rails-file';
import { RailsWorkspace } from '../rails-workspace';
import { SwitchFile } from '../types';
import { pluralize } from 'inflected';
import * as path from 'path';

export async function controllerMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  // For views, the controller name comes directly from the view directory name.
  // Going through singularize→pluralize breaks non-noun names like
  // "dashboard", "home", "api", etc.
  if (railsFile.isView()) {
    const controllerName = path.basename(railsFile.dirname) + '_controller.rb';
    return [
      {
        checkedExists: false,
        filename: path.join(
          workspace.controllersPath,
          railsFile.module,
          controllerName
        ),
        title: 'Controller ' + controllerName,
        type: 'controller',
      },
    ];
  }

  return railsFile.possibleModelNames().map(possibleModelName => {
    const controllerName = pluralize(possibleModelName) + '_controller.rb';
    return {
      checkedExists: false,
      filename: path.join(
        workspace.controllersPath,
        railsFile.module,
        controllerName
      ),
      title: 'Controller ' + controllerName,
      type: 'controller',
    };
  });
}

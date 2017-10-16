import { RailsFile, SwitchFile } from '../types';
import { RailsWorkspace, locationWithinAppLocation } from '../rails-workspace';
import { singularize } from 'inflected';
import * as fs from 'fs-extra';
import * as path from 'path';

export async function modelMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const justName = railsFile.basename
    .split('_')
    .slice(0, -1)
    .join('_');
  const singularName = singularize(justName);
  let location = locationWithinAppLocation(railsFile, workspace);

  while (true) {
    const modelPath = path.join(
      workspace.modelsPath,
      location,
      singularName + '.rb'
    );

    if (await fs.pathExists(modelPath)) {
      return [
        {
          filename: modelPath,
          title: 'Model ' + path.basename(modelPath),
          type: 'model',
          checkedExists: true,
        },
      ];
    }

    location = path.dirname(location);
    if (location === '.' || location.length === 0) {
      break;
    }
  }

  return [];
}

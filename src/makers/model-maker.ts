import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace, locationWithinAppLocation } from '../rails-workspace';
import { singularize } from 'inflected';
import * as fs from 'fs-extra';
import * as path from 'path';

function insideDir(root: string, filename: string): boolean {
  return !path.relative(root, filename).startsWith('..');
}

export async function modelMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const justName = railsFile.basename
    .split('_')
    .slice(0, -1)
    .join('_');
  const singularName = singularize(justName);
  let location = path.join(
    workspace.modelsPath,
    locationWithinAppLocation(railsFile, workspace)
  );

  while (insideDir(workspace.modelsPath, location)) {
    const modelPath = path.join(location, singularName + '.rb');

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
  }

  return [];
}

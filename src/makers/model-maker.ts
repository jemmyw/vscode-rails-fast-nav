import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace, locationWithinAppLocation } from '../rails-workspace';
import { singularize } from 'inflected';
import * as fs from 'fs-extra';
import * as path from 'path';

function insideDir(root: string, filename: string): boolean {
  return !path.relative(root, filename).startsWith('..');
}

function justName(railsFile: RailsFile) {
  if (railsFile.isView()) {
    return path.basename(railsFile.dirname);
  } else {
    return railsFile.basename
      .split('_')
      .slice(0, railsFile.isTest() ? -2 : -1)
      .join('_');
  }
}

export async function modelMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const models = await workspace.getModels();
  const possibleModelNames = railsFile.possibleModelNames();
  const modelToChecked = model => ({
    filename: model.filename,
    title: 'Model ' + model.basename,
    type: 'model',
    checkedExists: true,
  });

  if (railsFile.module.length > 0) {
    return models
      .filter(
        model =>
          model.module === railsFile.module &&
          possibleModelNames.indexOf(model.possibleModelNames()[0]) >= 0
      )
      .map(modelToChecked);
  }

  return possibleModelNames
    .reduce<RailsFile[]>((acc, possibleModelName) => {
      const parts = possibleModelName.split('_');

      for (let i = -1; Math.abs(i) <= parts.length; --i) {
        const modulePart = parts.slice(0, i).join('_');
        const modelPart = parts.slice(i).join('_');
        const model = models.find(
          model =>
            model.module === modulePart &&
            model.possibleModelNames()[0] === modelPart
        );
        if (model) acc.push(model);
      }

      return acc;
    }, [])
    .map(modelToChecked);

  const singularName = singularize(justName(railsFile));
  let location = path.join(
    workspace.modelsPath,
    locationWithinAppLocation(railsFile.filename, workspace)
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

import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace, getViewPath } from '../rails-workspace';
import * as path from 'path';
import * as fs from 'fs-extra';

function isPartial(filename: string): boolean {
  return path.basename(filename).startsWith('_');
}

function viewFileTitle(filename: string): string {
  return viewFileType(filename) + ' ' + path.basename(filename);
}

function viewFileType(filename: string): string {
  return isPartial(filename) ? 'Partial' : 'View';
}

export async function viewMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const viewPath = getViewPath(workspace, railsFile);

  if (!await fs.pathExists(viewPath)) {
    return [];
  }

  const files = await fs.readdir(viewPath);

  return files
    .sort(function(a, b) {
      if (a.startsWith('_') && !b.startsWith('_')) {
        return 1;
      }
      if (b.startsWith('_') && !a.startsWith('_')) {
        return 1;
      }
      const [aName, bName] = [a.split('.')[0], b.split('.')[0]];
      const [aMethod, bMethod] = [
        railsFile.methods.indexOf(aName) > -1,
        railsFile.methods.indexOf(bName) > -1,
      ];
      if (aMethod && !bMethod) {
        return -1;
      }
      if (bMethod && !aMethod) {
        return 1;
      }
      if (aName === railsFile.methodName) {
        return -1;
      }
      if (bName === railsFile.methodName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      if (bName < aName) {
        return 1;
      }
      return 0;
    })
    .map(file => ({
      checkedExists: true,
      filename: path.join(viewPath, file),
      title: viewFileTitle(file),
      type: viewFileType(file),
    }));
}

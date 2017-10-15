import { CurrentRailsFile } from './types';
import { RailsWorkspaceCache, RailsWorkspace } from './rails-workspace';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as vscode from 'vscode';

const viewExtensions = [
  'json',
  'json.jbuilder',
  'erb',
  'html.erb',
  'js',
  'js.erb',
];

interface SwitchFile {
  type: string;
  title: string;
  filename: string;
}

interface SwitchFileExists extends SwitchFile {
  exists: boolean;
}

type SlightPromise<T> = T | Promise<T>;

type SwitchMatcher = (
  railsFile: CurrentRailsFile,
  workspace: RailsWorkspace
) => SlightPromise<boolean>;
type SwitchMaker = (
  railsFile: CurrentRailsFile,
  workspace: RailsWorkspace
) => SlightPromise<SwitchFile | SwitchFile[]>;

function switchRule(matcher: SwitchMatcher, maker: SwitchMaker): SwitchMaker {
  return async function(
    railsFile: CurrentRailsFile,
    workspace: RailsWorkspace
  ) {
    if (await matcher(railsFile, workspace)) {
      const files = await maker(railsFile, workspace);
      if (Array.isArray(files)) {
        return files;
      } else {
        return [files];
      }
    } else {
      return [];
    }
  };
}

function relativeToAppDir(
  railsFile: CurrentRailsFile,
  workspace: RailsWorkspace
): string {
  return path.relative(workspace.appPath, railsFile.filename);
}

function appendWithoutExt(filename: string, append: string): string {
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  return path.join(path.dirname(filename), basename + append + '.' + ext);
}

function specPath(
  railsFile: CurrentRailsFile,
  workspace: RailsWorkspace
): SwitchFile {
  return {
    filename: path.join(
      workspace.specPath,
      appendWithoutExt(relativeToAppDir(railsFile, workspace), '_spec')
    ),
    title: 'Spec file',
    type: 'spec',
  };
}

function testPath(
  railsFile: CurrentRailsFile,
  workspace: RailsWorkspace
): SwitchFile {
  return {
    filename: path.join(
      workspace.testPath,
      appendWithoutExt(relativeToAppDir(railsFile, workspace), '_test')
    ),
    title: 'Test file',
    type: 'test',
  };
}

function isInAppDir(dir: string) {
  return (railsFile: CurrentRailsFile) =>
    railsFile.inApp && railsFile.filename.includes('/' + dir + '/');
}

const isController = isInAppDir('controllers');
const isModel = isInAppDir('models');
const isView = isInAppDir('views');

async function modelMaker(railsFile:CurrentRailsFile, workspace:RailsWorkspace) {
  const justName = railsFile.filename.split('_').slice(0, -1).join('_');
  const singularName = 




}

const rules = [
  switchRule((f, w) => w.hasSpecs(), specPath),
  switchRule((f, w) => w.hasTests(), testPath),
  switchRule(isController, modelMaker),
  switchRule(isController, viewMaker),
  switchRule(isModel, controllerMaker),
  switchRule(isView, controllerMaker),
];

type TypePossible = (railsFile: CurrentRailsFile) => SwitchFile[];

function typePossibles(railsFile: CurrentRailsFile): TypePossible {
  switch (railsFile.fileType) {
    case 'controllers': {
      return file => {
        const possibles: SwitchFile[] = [];
        const viewReg = /\/controllers\/(.+)_controller.rb/;
        const matches = file.filename.match(viewReg);

        if (matches) {
          const viewPath = matches[1];

          file.methods.forEach(method =>
            viewExtensions.forEach(ext =>
              possibles.push({
                filename: path.join(
                  railsFile.railsRoot,
                  'app/views',
                  viewPath,
                  method + '.' + ext
                ),
                title: `View ${method}.${ext}`,
                type: 'view',
              })
            )
          );

          return possibles;
        }
      };
    }
    default: {
      return () => [];
    }
  }
}

function getPossibleSwitches(
  railsFile: CurrentRailsFile,
  workspace: RailsWorkspace
): SwitchFile[] {
  const possibles: SwitchFile[] = [];

  if (workspace.hasSpecs) {
    possibles.push(specFile(railsFile));
  }

  possibles.push(testFile(railsFile));

  const typePossible = typePossibles(railsFile);
  typePossible(railsFile).forEach(p => possibles.push(p));

  return possibles;
}

export function switchFileAbsolutePath(
  railsFile: CurrentRailsFile,
  file: SwitchFile
): string {
  return path.join(railsFile.railsRoot, file.filename);
}

async function switchFileExists(file: SwitchFile) {
  return fs.pathExists(file.filename);
}

export async function getCheckedSwitches(railsFile: CurrentRailsFile) {
  const workspace = RailsWorkspaceCache.fetch(railsFile.railsRoot);
  const switches = getPossibleSwitches(railsFile, workspace);

  return switches.filter(file => {
    return fs.pathExists(file.filename);
  });
}

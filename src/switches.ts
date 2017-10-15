import { CurrentRailsFile } from './types';
import { RailsWorkspaceCache, RailsWorkspace } from './rails-workspace';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as vscode from 'vscode';
import { singularize, pluralize } from 'inflected';

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
  checkedExists?: boolean;
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
type SwitchRule = (
  railsFile: CurrentRailsFile,
  workspace: RailsWorkspace
) => Promise<SwitchFile[]>;

function switchRule(matcher: SwitchMatcher, maker: SwitchMaker): SwitchRule {
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
  return path.join(path.dirname(filename), basename + append + ext);
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

function locationWithinAppLocation(
  railsFile: CurrentRailsFile,
  workspace: RailsWorkspace
): string {
  return path
    .dirname(relativeToAppDir(railsFile, workspace))
    .split(path.sep)
    .slice(1)
    .join(path.sep);
}

async function modelMaker(
  railsFile: CurrentRailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const justName = railsFile.basename
    .split('_')
    .slice(0, -1)
    .join('_');
  const singularName = singularize(justName);
  let location = locationWithinAppLocation(railsFile, workspace);

  while (location.length > 0) {
    const modelPath = path.join(workspace.modelsPath, location, singularName);

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

function flatMap<T, R>(fn: (item: T, index: number) => R | R[], ary: T[]): R[] {
  const acc: R[] = [];

  for (let i = 0; i < ary.length; i++) {
    const items: R | R[] = fn(ary[i], i);
    if (Array.isArray(items)) {
      acc.push(...items);
    } else {
      acc.push(items);
    }
  }

  return acc;
}

async function viewMaker(
  railsFile: CurrentRailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  const justName = railsFile.basename
    .split('_')
    .slice(0, -1)
    .join('_');
  const viewPath = path.relative(
    workspace.path,
    path.join(
      workspace.viewsPath,
      locationWithinAppLocation(railsFile, workspace),
      justName
    )
  );

  return await Promise.all(
    railsFile.methods.map(methodName =>
      vscode.workspace
        .findFiles(path.join(viewPath, methodName + '*'), null, 10)
        .then(files =>
          files.map((file: vscode.Uri): SwitchFile => ({
            checkedExists: true,
            filename: file.fsPath,
            title: 'View ' + path.basename(file.fsPath),
            type: 'view',
          }))
        )
    )
  ).then((allViews: SwitchFile[][]): SwitchFile[] => {
    return [].concat(...allViews);
  });
}

async function controllerMaker(
  railsFile: CurrentRailsFile,
  workspace: RailsWorkspace
): Promise<SwitchFile[]> {
  if (isView(railsFile)) {
    const controllerName =
      path.basename(path.dirname(railsFile.filename)) + '_controller.rb';

    return [
      {
        filename: path.join(workspace.controllersPath, controllerName),
        title: 'Controller',
        type: 'controller',
      },
    ];
  } else if (isModel(railsFile)) {
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

const rules = [
  switchRule((f, w) => w.hasSpecs(), specPath),
  // switchRule((f, w) => w.hasTests(), testPath),
  // switchRule(isController, modelMaker),
  // switchRule(isController, viewMaker),
  // switchRule(isModel, controllerMaker),
  // switchRule(isView, controllerMaker),
];

export async function getCheckedSwitches(
  railsFile: CurrentRailsFile
): Promise<SwitchFile[]> {
  const workspace = await RailsWorkspaceCache.fetch(railsFile.railsRoot);
  const switches = await Promise.all(
    rules.map(rule => rule(railsFile, workspace))
  ).then(switches => [].concat(...switches));

  const withExisting = await Promise.all(
    switches.map(async (switchFile: SwitchFile) => {
      if (switchFile.checkedExists) {
        return switchFile;
      }

      const exists = await fs.pathExists(switchFile.filename);

      return {
        ...switchFile,
        checkedExists: exists,
      };
    })
  );

  return withExisting.filter(sf => sf.checkedExists);
}

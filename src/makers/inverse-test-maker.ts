import { SwitchFile } from '../types';
import { RailsFile } from '../rails-file';
import { RailsWorkspace } from '../rails-workspace';
import * as path from 'path';

function relativeFromSpecOrTestRoots(
  workspace: RailsWorkspace,
  filename: string
): string | undefined {
  const roots = [
    ...workspace.getCandidateSpecRoots(),
    ...workspace.getCandidateTestRoots(),
  ].sort((a, b) => b.length - a.length);

  for (const root of roots) {
    const rel = path.relative(root, filename);
    if (
      rel &&
      !path.isAbsolute(rel) &&
      !rel.startsWith('..') &&
      !rel.startsWith('..' + path.sep)
    ) {
      return rel;
    }
  }
  return undefined;
}

function resolveAppPathFromTestOrSpecFile(
  workspace: RailsWorkspace,
  railsFile: RailsFile
): string {
  const all = [
    ...workspace.getCandidateSpecRoots(),
    ...workspace.getCandidateTestRoots(),
  ].sort((a, b) => b.length - a.length);

  let matchedRoot: string | null = null;
  for (const root of all) {
    const rel = path.relative(root, railsFile.filename);
    if (
      rel &&
      !path.isAbsolute(rel) &&
      !rel.startsWith('..') &&
      !rel.startsWith('..' + path.sep)
    ) {
      matchedRoot = root;
      break;
    }
  }
  if (!matchedRoot) {
    return workspace.appPath;
  }

  const pkgRoot = path.dirname(matchedRoot);
  const candidateApp = path.normalize(path.join(pkgRoot, 'app'));
  const apps = workspace.getExpandedAppRoots();
  if (apps.indexOf(candidateApp) >= 0) {
    return candidateApp;
  }
  return workspace.appPath;
}

export function inverseTestMaker(
  railsFile: RailsFile,
  workspace: RailsWorkspace
): SwitchFile[] {
  if (!railsFile.isTest()) {
    return [];
  }

  const basename = railsFile.basename.replace(/_(spec|test)/, '');
  const relativeFilename = relativeFromSpecOrTestRoots(
    workspace,
    railsFile.filename
  );
  if (!relativeFilename) {
    return [];
  }
  const relativePath = path.dirname(relativeFilename);

  const appPath = resolveAppPathFromTestOrSpecFile(workspace, railsFile);

  return [
    {
      filename: path.join(appPath, relativePath, basename),
      title: 'File',
      type: 'file',
    },
    {
      filename: path.join(workspace.path, relativePath, basename),
      title: 'File',
      type: 'file',
    },
  ];
}

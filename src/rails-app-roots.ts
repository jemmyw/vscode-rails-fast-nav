import * as vscode from 'vscode';
import {
  expandRailsAppRootsWithPatterns,
  findContainingAppRoot,
} from './rails-app-expand';

const rootsCache = new Map<string, { sig: string; roots: string[] }>();

export function getConfiguredAppDirPatterns(): string[] {
  const config = vscode.workspace.getConfiguration('rails');
  const appDirs = config.get<string[]>('appDirs');
  if (Array.isArray(appDirs) && appDirs.length > 0) {
    return appDirs.map(p => p.trim()).filter(Boolean);
  }
  return [config.get<string>('appDir', 'app')];
}

export function clearRailsAppRootsCache(): void {
  rootsCache.clear();
}

export function clearRailsAppRootsCacheFor(railsRoot: string): void {
  rootsCache.delete(railsRoot);
}

function patternsSignature(): string {
  return JSON.stringify(getConfiguredAppDirPatterns());
}

export { expandRailsAppRootsWithPatterns, findContainingAppRoot };

export function expandRailsAppRoots(railsRoot: string): string[] {
  const sig = patternsSignature();
  const hit = rootsCache.get(railsRoot);
  if (hit && hit.sig === sig) {
    return hit.roots;
  }
  const patterns = getConfiguredAppDirPatterns();
  const roots = expandRailsAppRootsWithPatterns(railsRoot, patterns);
  rootsCache.set(railsRoot, { sig, roots });
  return roots;
}

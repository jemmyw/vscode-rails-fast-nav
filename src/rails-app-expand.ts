import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';

function hasGlobChar(pattern: string): boolean {
  return /[*?[\]{}]/.test(pattern);
}

function addDirIfPresent(roots: Set<string>, dir: string): void {
  const norm = path.normalize(dir);
  if (fs.existsSync(norm) && fs.statSync(norm).isDirectory()) {
    roots.add(norm);
  }
}

function sortAppRootsForPrimary(railsRoot: string, roots: string[]): string[] {
  return roots.sort((a, b) => {
    const aMain = path.dirname(a) === railsRoot;
    const bMain = path.dirname(b) === railsRoot;
    if (aMain !== bMain) {
      return aMain ? -1 : 1;
    }
    if (a.length !== b.length) {
      return a.length - b.length;
    }
    return a.localeCompare(b);
  });
}

/**
 * Expand app directory patterns under a Rails root (no VS Code; safe for unit tests).
 */
export function expandRailsAppRootsWithPatterns(
  railsRoot: string,
  patterns: string[]
): string[] {
  const roots = new Set<string>();
  for (const pattern of patterns) {
    const trimmed = pattern.trim();
    if (!trimmed) {
      continue;
    }

    if (path.isAbsolute(trimmed)) {
      if (hasGlobChar(trimmed)) {
        const matches = glob.sync(trimmed, { absolute: true, nodir: false });
        for (const m of matches) {
          addDirIfPresent(roots, m);
        }
      } else {
        addDirIfPresent(roots, trimmed);
      }
      continue;
    }

    const joined = path.join(railsRoot, trimmed);
    if (!hasGlobChar(trimmed)) {
      addDirIfPresent(roots, joined);
      continue;
    }

    const matches = glob.sync(joined, { nodir: false });
    for (const m of matches) {
      addDirIfPresent(roots, m);
    }
  }
  return sortAppRootsForPrimary(railsRoot, [...roots]);
}

/**
 * Longest matching app root directory that contains filePath.
 */
export function findContainingAppRoot(
  filePath: string,
  expandedAppRoots: string[]
): string | null {
  const norm = path.normalize(filePath);
  const sep = path.sep;
  const sorted = [...expandedAppRoots].sort((a, b) => b.length - a.length);
  for (const root of sorted) {
    const r = path.normalize(root);
    if (norm === r || norm.startsWith(r + sep)) {
      return r;
    }
  }
  return null;
}

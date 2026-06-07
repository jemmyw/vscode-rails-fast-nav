import { expect } from 'chai';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import {
  expandRailsAppRootsWithPatterns,
  findContainingAppRoot,
} from '../rails-app-expand';

describe('rails-app-expand', () => {
  let tmp: string;
  let railsRoot: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'rfn-'));
    railsRoot = path.join(tmp, 'myapp');
    await fs.ensureFile(path.join(railsRoot, 'bin', 'rails'));
    await fs.ensureDir(path.join(railsRoot, 'app', 'models'));
    await fs.ensureDir(path.join(railsRoot, 'packs', 'billing', 'app', 'models', 'billing'));
    await fs.ensureDir(path.join(railsRoot, 'engines', 'docs', 'app', 'controllers'));
  });

  afterEach(async () => {
    await fs.remove(tmp);
  });

  it('expands glob patterns and prefers top-level app', () => {
    const roots = expandRailsAppRootsWithPatterns(railsRoot, [
      'packs/*/app',
      'engines/*/app',
      'app',
    ]);
    expect(roots.length).to.equal(3);
    expect(roots[0]).to.equal(path.join(railsRoot, 'app'));
  });

  it('finds the longest matching app root for a nested file', () => {
    const roots = expandRailsAppRootsWithPatterns(railsRoot, [
      'app',
      'packs/*/app',
    ]);
    const modelFile = path.join(
      railsRoot,
      'packs',
      'billing',
      'app',
      'models',
      'billing',
      'invoice.rb'
    );
    const hit = findContainingAppRoot(modelFile, roots);
    expect(hit).to.equal(path.join(railsRoot, 'packs', 'billing', 'app'));
  });
});

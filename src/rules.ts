import { RailsFile } from './rails-file';
import { RailsWorkspace } from './rails-workspace';
import { SwitchMaker, SwitchMatcher, SwitchRule } from './types';
import {
  controllerMaker,
  modelMaker,
  viewMaker,
  specMaker,
  testMaker,
  inverseTestMaker,
  fixtureMaker,
  modelTestMaker,
} from './makers';

function switchRule(matcher: SwitchMatcher, maker: SwitchMaker): SwitchRule {
  return async function(railsFile: RailsFile, workspace: RailsWorkspace) {
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

export const rules = [
  switchRule((f, w) => w.hasSpecs(), specMaker),
  switchRule((f, w) => w.hasTests(), testMaker),
  switchRule((f, w) => f.isTest(), inverseTestMaker),
  switchRule(f => !f.isModel(), modelMaker),
  switchRule(f => f.isController(), viewMaker),
  switchRule(f => f.isModel() || f.isView(), controllerMaker),
  switchRule(f => !f.isFixture(), fixtureMaker),
  switchRule(f => !f.isModelTest(), modelTestMaker)
];

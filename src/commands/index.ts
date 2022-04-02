import { navigateRails } from './navigation';
import { switchToView } from './switch-to-view';
import { switchToModel } from './switch-to-model';
import { switchToTest } from './switch-to-test';
import { switchToController } from './switch-to-controller';
import { switchToControllerTest } from './switch-to-controller-test';
import { switchToFixture } from './switch-to-fixture';
import { switchToModelTest } from './switch-to-model-test';
import { createView } from './create-view';
import { createSpec } from './create-spec';

export const commands = {
  fastNavigation: navigateRails,
  switchToView: switchToView,
  switchToModel: switchToModel,
  switchToTest: switchToTest,
  switchToSpec: switchToTest,
  switchToController: switchToController,
  switchToControllerTest,
  switchToModelTest,
  switchToFixture,
  createView,
  createSpec,
};

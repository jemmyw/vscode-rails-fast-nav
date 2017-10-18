import { navigateRails } from './navigation';
import { switchToView } from './switch-to-view';
import { switchToModel } from './switch-to-model';
import { switchToTest } from './switch-to-test';

export const commands = {
  Navigation: navigateRails,
  SwitchToView: switchToView,
  SwitchToModel: switchToModel,
  SwitchToTest: switchToTest,
  SwitchToSpec: switchToTest,
};

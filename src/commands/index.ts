export * from './navigation';
export * from './switch-to-view';
import { navigateRails } from './navigation';
import { switchToView } from './switch-to-view';

export const commands = {
  Navigation: navigateRails,
  SwitchToView: switchToView,
};

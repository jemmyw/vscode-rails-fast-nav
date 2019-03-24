'use strict';

import * as vscode from 'vscode';
import { commands } from './commands';
import { RailsWorkspaceCache } from './rails-workspace';

export function activate(context: vscode.ExtensionContext) {
  Object.keys(commands).forEach(name => {
    const command = commands[name];
    const disposable = vscode.commands.registerCommand(
      `rails.${name}`,
      command
    );

    context.subscriptions.push(disposable);
  });
}

export function deactivate() {
  if (RailsWorkspaceCache) {
    RailsWorkspaceCache.dispose();
  }
}

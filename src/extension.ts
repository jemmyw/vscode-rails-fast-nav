'use strict';

import * as vscode from 'vscode';
import { commands } from './commands';

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

export function deactivate() {}

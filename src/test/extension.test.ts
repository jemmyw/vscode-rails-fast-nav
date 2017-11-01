//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as expect from 'unexpected';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';
import * as path from 'path';

const projectPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

async function openFile(filename: string) {
  await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument(path.join(projectPath, filename))
  );
}

suite('Extension Tests', function() {
  setup(async () => {
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  test('commands are available', async () => {
    await openFile('app/controllers/cats_controller.rb');

    const commands = (await vscode.commands.getCommands()).filter(c =>
      c.startsWith('rails.')
    );

    for (let command of [
      'fastNavigation',
      'switchToView',
      'switchToModel',
      'switchToSpec',
      'switchToTest',
      'createView',
      'createSpec',
    ]) {
      expect(commands, 'to have an item satisfying to be', `rails.${command}`);
    }
  }).timeout(5000);

  test('switch to model', async () => {
    await openFile('app/controllers/cats_controller.rb');
    await vscode.commands.executeCommand('rails.switchToModel');
    expect(
      vscode.window.activeTextEditor.document.fileName,
      'to end with',
      'app/models/cat.rb'
    );
  });

  // Mock quickPick
  test.skip('switch to view, all actions', async () => {
    await openFile('app/controllers/cats_controller.rb');
    await vscode.commands.executeCommand('rails.switchToView');
  });

  test.skip('switch to view', async () => {
    await openFile('app/controllers/cats_controller.rb');
    await vscode.commands.executeCommand('workbench.action.gotoLine', 7);
    await vscode.commands.executeCommand('rails.switchToView');
    expect(
      vscode.window.activeTextEditor.document.fileName,
      'to end with',
      'app/views/cats/show.js.erb'
    );
  });

  test('switch to spec', async () => {
    await openFile('app/models/cat.rb');
    await vscode.commands.executeCommand('rails.switchToSpec');
    expect(
      vscode.window.activeTextEditor.document.fileName,
      'to end with',
      'spec/models/cat_spec.rb'
    );
  });

  test('create spec', async () => {
    await openFile('app/controllers/cats_controller.rb');
    await vscode.commands.executeCommand('rails.createSpec');
    expect(
      vscode.window.activeTextEditor.document.fileName,
      'to end with',
      'spec/controllers/cats_controller_spec.rb'
    );
  });
});

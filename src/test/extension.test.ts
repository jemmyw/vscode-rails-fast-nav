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

let projectPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

async function openFile(filename: string) {
  await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument(path.join(projectPath, filename))
  );
}

function expectProjectFile(name: string) {
  expect(vscode.window.activeTextEditor.document.fileName, 'to end with', name);
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
  }).timeout(60000);

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

  test('switch to view', async () => {
    await openFile('app/controllers/cats_controller.rb');
    vscode.window.activeTextEditor.selection = new vscode.Selection(8, 0, 8, 0);
    await vscode.commands.executeCommand('rails.switchToView');
    expect(
      vscode.window.activeTextEditor.document.fileName,
      'to end with',
      'app/views/cats/show.js.erb'
    );
  });

  test('switch to haml view', async () => {
    await openFile('app/controllers/cats_controller.rb');
    vscode.window.activeTextEditor.selection = new vscode.Selection(
      12,
      0,
      12,
      0
    );
    await vscode.commands.executeCommand('rails.switchToView');
    expect(
      vscode.window.activeTextEditor.document.fileName,
      'to end with',
      'app/views/cats/edit.html.haml'
    );
  });

  test('switch to controller', async () => {
    await openFile('app/views/cats/_cat.html.erb');
    await vscode.commands.executeCommand('rails.switchToController');
    expectProjectFile('app/controllers/cats_controller.rb');
  });

  test('switch to module fixture', async () => {
    await openFile('app/models/big/lion.rb');
    await vscode.commands.executeCommand('rails.switchToFixture');
    expectProjectFile('spec/fixtures/big_lions.yml');
  });

  test('switch to module controller', async () => {
    await openFile('app/views/big/lions/new.html.erb');
    await vscode.commands.executeCommand('rails.switchToController');
    expectProjectFile('app/controllers/big/lions_controller.rb');
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

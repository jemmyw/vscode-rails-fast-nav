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

async function openFile(filename: string, line?: number) {
  await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument(path.join(projectPath, filename))
  );

  if (line > 0) gotoLine(line);
}

function expectProjectFile(name: string) {
  expect(vscode.window.activeTextEditor.document.fileName, 'to end with', name);
}

function gotoLine(line: number): void {
  vscode.window.activeTextEditor.selection = new vscode.Selection(
    line + 1,
    0,
    line + 1,
    0
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
    await openFile('app/controllers/cats_controller.rb', 7);
    await vscode.commands.executeCommand('rails.switchToView');
    expect(
      vscode.window.activeTextEditor.document.fileName,
      'to end with',
      'app/views/cats/show.js.erb'
    );
  });

  test('switch to haml view', async () => {
    await openFile('app/controllers/cats_controller.rb', 11);
    await vscode.commands.executeCommand('rails.switchToView');
    expect(
      vscode.window.activeTextEditor.document.fileName,
      'to end with',
      'app/views/cats/edit.html.haml'
    );
  });

  suite('create view', () => {
    const showInputBox = vscode.window.showInputBox;

    test('with default extension', async () => {
      try {
        vscode.window.showInputBox = ({ value }) => {
          return new Promise(r => r(value));
        };

        await openFile('app/controllers/cats_controller.rb', 15);
        await vscode.commands.executeCommand('rails.createView');

        expect(
          vscode.window.activeTextEditor.document.fileName,
          'to end with',
          'app/views/cats/new.html.erb'
        );
      } finally {
        vscode.window.showInputBox = showInputBox;
      }
    });

    test('with custom extension', async () => {
      const config = vscode.workspace.getConfiguration('rails');

      try {
        config.update('viewFileExtension', 'html.haml');
        vscode.window.showInputBox = ({ value }) => {
          return new Promise(r => r(value));
        };

        await openFile('app/controllers/cats_controller.rb', 15);
        await vscode.commands.executeCommand('rails.createView');

        expect(
          vscode.window.activeTextEditor.document.fileName,
          'to end with',
          'app/views/cats/new.html.erb'
        );
      } finally {
        vscode.window.showInputBox = showInputBox;
        config.update('viewFileExtension', undefined);
      }
    });
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

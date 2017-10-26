import { getViewPath } from '../rails-workspace';
import { getRailsContext } from '../rails-context';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';

export async function createView() {
  return getRailsContext(async function(railsFile, workspace) {
    if (!railsFile.isController()) {
      return;
    }

    const value =
      railsFile.methodName && railsFile.methodName.length > 0
        ? `${railsFile.methodName}.html.erb`
        : '';

    const viewName = await vscode.window.showInputBox({
      value,
      prompt: `Create view for controller ${railsFile.classname}`,
      placeHolder: 'index.html.erb',
    });

    if (!viewName || viewName === '') {
      return;
    }

    const viewPath = getViewPath(railsFile, workspace);
    await fs.mkdirp(viewPath);
    const viewFile = path.join(viewPath, viewName);
    await fs.ensureFile(viewFile);

    const document = await vscode.workspace.openTextDocument(viewFile);
    await vscode.window.showTextDocument(document);
  });
}

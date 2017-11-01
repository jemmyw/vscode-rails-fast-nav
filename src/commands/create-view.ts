import { getViewPath } from '../rails-workspace';
import { getRailsContext } from '../rails-context';
import { ensureDocument } from '../path-utils';
import * as vscode from 'vscode';
import * as path from 'path';

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
    const viewFile = path.join(viewPath, viewName);
    return await ensureDocument(viewFile);
  });
}

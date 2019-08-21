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
    const extension = vscode.workspace.getConfiguration('rails').get('viewFileExtension');
    const value =
      railsFile.methodName && railsFile.methodName.length > 0
        ? `${railsFile.methodName}.${extension}`
        : '';

    const viewName = await vscode.window.showInputBox({
      value,
      prompt: `Create view for controller ${railsFile.classname}`,
      placeHolder: `index.${extension}`,
    });

    if (!viewName || viewName === '') {
      return;
    }

    const viewPath = getViewPath(workspace, railsFile);
    const viewFile = path.join(viewPath, viewName);
    return await ensureDocument(viewFile);
  });
}

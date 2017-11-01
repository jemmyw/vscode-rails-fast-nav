import * as path from 'path';
import * as fs from 'fs-extra';
import * as vscode from 'vscode';

/**
 * Given a path like '/path/to/something.ext' and an append string '_extra',
 * returns '/path/to/something_extra.ext'
 */
export function appendWithoutExt(filename: string, append: string): string {
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  return path.join(path.dirname(filename), basename + append + ext);
}

export async function ensureDocument(filename: string) {
  await fs.ensureFile(filename);
  const document = await vscode.workspace.openTextDocument(filename);
  await vscode.window.showTextDocument(document);
}

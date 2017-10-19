import * as vscode from 'vscode';

const defReg = /def\s+(\w+)/g;

/**
 * Given a document and a line, walk up the document to find a method definiton.
 * We assume that's the method we're in.
 */
export function getLastMethodName(
  document: vscode.TextDocument,
  line: number
): string | null {
  for (let i = line; i >= 0; i--) {
    const line = document.lineAt(i);
    const matches = defReg.exec(line.text);

    if (matches) {
      return matches[1];
    }
  }
}

/**
 * Find all methods names in the document. This is a simple regex search, so it
 * returns everything matching 'def ...'
 */
export function getAllMethodNames(document: vscode.TextDocument): string[] {
  const text = document.getText();
  const names: string[] = [];
  let match;

  while ((match = defReg.exec(text))) {
    names.push(match[1]);
  }

  return names;
}

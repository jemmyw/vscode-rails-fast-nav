import * as vscode from 'vscode';

const defReg = /def\s+(\w+)/g;

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

export function getAllMethodNames(document: vscode.TextDocument): string[] {
  const text = document.getText();
  const names: string[] = [];
  let match;

  while ((match = defReg.exec(text))) {
    names.push(match[1]);
  }

  return names;
}

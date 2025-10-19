import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { INodeItem } from '../../types';

export function registerOpenJsonFile(
  context: vscode.ExtensionContext,
  workspaceFolders: readonly vscode.WorkspaceFolder[]
) {
  const disposable = vscode.commands.registerCommand('featureAssured.openJsonFile', (node: INodeItem) => {
    if (!node?.tooltip) {
      vscode.window.showWarningMessage('No file path associated with this node.');
      return;
    }

    const fullPath = path.join(workspaceFolders[0].uri.fsPath, 'cypress', 'e2e', node.tooltip);
    if (!fs.existsSync(fullPath)) {
      vscode.window.showErrorMessage(`File not found: ${fullPath}`);
      return;
    }

    vscode.workspace.openTextDocument(vscode.Uri.file(fullPath)).then(doc => {
      vscode.window.showTextDocument(doc);
    });
  });

  context.subscriptions.push(disposable);
}
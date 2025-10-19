import * as vscode from 'vscode';
import { ExplorerTreeProvider } from '../../editor/ExplorerTreeProvider';

export function registerRefreshExplorer(
  context: vscode.ExtensionContext,
  treeProvider: ExplorerTreeProvider
) {
  const disposable = vscode.commands.registerCommand('featureAssured.refresh', () => {
    treeProvider.refresh();
    vscode.window.showInformationMessage('Feature explorer refreshed.');
  });
  context.subscriptions.push(disposable);
}
import * as vscode from 'vscode';
import { ExplorerTreeProvider } from '../../editor/ExplorerTreeProvider';
import { INodeItem } from '../../types';

export function registerAddChildNode(
  context: vscode.ExtensionContext,
  treeProvider: ExplorerTreeProvider
) {
  const disposable = vscode.commands.registerCommand('featureAssured.addChildNode', async (node: INodeItem) => {
    const optionsByContext: Record<string, string[]> = {
      pageNode: ['Menu', 'Form'],
      menuNode: ['Menu'],
      formNode: ['Field', 'Button'],
      serviceNode: ['Endpoint']
    };

    const options = optionsByContext[node.contextValue!];
    if (!options) {
      vscode.window.showWarningMessage('This node type cannot have children.');
      return;
    }

    const choice = await vscode.window.showQuickPick(options, { placeHolder: 'Select child type to add' });
    if (choice) treeProvider.addChildNode(node, choice as any);
  });

  context.subscriptions.push(disposable);
}
import * as vscode from 'vscode';
import { getFeatureAssuredTerminal } from '../../utils/terminalManager';

export function registerShowExamples(
  context: vscode.ExtensionContext,
  workspaceFolders: readonly vscode.WorkspaceFolder[]
) {
  const disposable = vscode.commands.registerCommand('featureAssured.showExamples', () => {
    const terminal = getFeatureAssuredTerminal();
    terminal.sendText(`printf '3\\n' | npx feature-assured add-examples`);
    terminal.show();
  });
  context.subscriptions.push(disposable);
}
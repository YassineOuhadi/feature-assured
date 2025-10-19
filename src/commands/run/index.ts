import * as vscode from 'vscode';
import { runFeatureCommand } from './runFeature';
import { FeatureReportDecorator } from '../../editor/FeatureReportDecorator';

export function initRunCommands(
  context: vscode.ExtensionContext,
  workspaceFolders: readonly vscode.WorkspaceFolder[],
  reportDecorator: FeatureReportDecorator
) {
  const commands = [
    {
      id: 'extension.runFeature',
      callback: (filePath: string) => runFeatureCommand(filePath, workspaceFolders, reportDecorator),
    },
  ];

  for (const { id, callback } of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(id, callback));
  }
}

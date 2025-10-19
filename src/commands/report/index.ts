import * as vscode from 'vscode';
import { viewScreenshotCommand } from './viewScreenshot';

export function initReportCommands(context: vscode.ExtensionContext) {
  const commands = [
    {
      id: 'featureAssured.viewScreenshot',
      callback: (step: any) => viewScreenshotCommand(step),
    },
  ];

  for (const { id, callback } of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(id, callback));
  }
}
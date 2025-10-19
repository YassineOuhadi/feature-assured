import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { pingLogBuffer } from './_pingUtils.ts';

export function registerExportPingResultsCommand(context: vscode.ExtensionContext, workspaceFolders: readonly vscode.WorkspaceFolder[]) {
  const disposable = vscode.commands.registerCommand('extension.exportPingResults', async () => {
    if (pingLogBuffer.length === 0) {
      vscode.window.showWarningMessage('No ping logs to export.');
      return;
    }

    const choice = await vscode.window.showQuickPick(['JSON', 'CSV'], { placeHolder: 'Select export format' });
    if (!choice) return;

    const defaultUri = vscode.Uri.file(
      path.join(workspaceFolders[0].uri.fsPath, `cypress-ping-results.${choice.toLowerCase()}`)
    );

    const uri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: { [choice]: [choice.toLowerCase()] }
    });
    if (!uri) return;

    try {
      let content = '';
      if (choice === 'JSON') {
        const entries = pingLogBuffer.map(line => ({
          timestamp: line.split('] ')[0].substring(1),
          message: line.split('] ')[1] || ''
        }));
        content = JSON.stringify(entries, null, 2);
      } else {
        const header = 'Timestamp,Message\n';
        const rows = pingLogBuffer.map(line => {
          const parts = line.split('] ');
          const ts = `"${parts[0].substring(1)}"`;
          const msg = `"${(parts[1] || '').replace(/"/g, '""')}"`;
          return `${ts},${msg}`;
        }).join('\n');
        content = header + rows;
      }

      await fs.promises.writeFile(uri.fsPath, content, 'utf-8');
      vscode.window.showInformationMessage(`Ping results exported to: ${uri.fsPath}`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Export failed: ${err.message}`);
    }
  });

  context.subscriptions.push(disposable);
}
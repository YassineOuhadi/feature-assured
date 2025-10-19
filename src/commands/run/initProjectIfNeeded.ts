import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getFeatureAssuredTerminal } from '../../utils/terminalManager';

export async function initProjectIfNeeded(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined): Promise<boolean> {
  if (!workspaceFolders || workspaceFolders.length === 0) return false;

  const projectPath = workspaceFolders[0].uri.fsPath;
  const envFolder = path.join(projectPath, 'cypress', 'env');
  const configFile = path.join(projectPath, 'cypress.config.js');

  if (fs.existsSync(envFolder) && fs.existsSync(configFile)) return true;

  const terminal = getFeatureAssuredTerminal();
  const init = await vscode.window.showInformationMessage(
    'Cypress project is not initialized. Click "Init" to initialize it.',
    'Init'
  );

  if (init === 'Init') {
    terminal.sendText(`npx feature-assured init`);
    terminal.show();
    return false; // project is now initializing
  }

  return false;
}
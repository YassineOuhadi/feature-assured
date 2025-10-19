import * as vscode from 'vscode';
import * as path from 'path';
import { ExplorerTreeProvider } from '../editor/ExplorerTreeProvider';
import { buildRegistryFileTypeMap } from './registryUtils';

export function createWatchers(
  workspaceRoot: string,
  treeProvider: ExplorerTreeProvider,
  context: vscode.ExtensionContext
) {
  const envPath = path.join(workspaceRoot, 'cypress', 'env');
  const e2ePath = path.join(workspaceRoot, 'cypress', 'e2e');

  const envWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(envPath, '*.json')
  );
  const e2eWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(e2ePath, '**/*.json')
  );

  const refreshAll = () => {
    buildRegistryFileTypeMap(workspaceRoot);
    treeProvider.refresh();
  };

  vscode.window.onDidChangeActiveColorTheme(() => {
    treeProvider.refresh();
  });

  envWatcher.onDidCreate(refreshAll);
  envWatcher.onDidChange(refreshAll);
  envWatcher.onDidDelete(refreshAll);

  e2eWatcher.onDidCreate(refreshAll);
  e2eWatcher.onDidChange(refreshAll);
  e2eWatcher.onDidDelete(refreshAll);

  context.subscriptions.push(envWatcher, e2eWatcher);
}
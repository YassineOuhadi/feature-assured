import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { INodeItem } from '../../types';
import { appendPingLog, resetPingLogs, updatePingLogsContext } from './_pingUtils.ts';

export function registerPingEndpointCommand(context: vscode.ExtensionContext, workspaceFolders: readonly vscode.WorkspaceFolder[]) {
  const disposable = vscode.commands.registerCommand('extension.pingEndpoint', async (node: INodeItem) => {
    resetPingLogs();
    if (!node?.label || node.contextValue !== 'endpointNode') {
      vscode.window.showErrorMessage('Invalid endpoint node.');
      return;
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;
    const jsonPath = path.join(workspacePath, 'cypress', 'e2e', node.tooltip!);
    if (!fs.existsSync(jsonPath)) {
      vscode.window.showErrorMessage(`Config file not found: ${jsonPath}`);
      return;
    }

    try {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      const apiConfig = JSON.parse(content);
      const baseUrl = apiConfig.BASE_URL?.trim();
      if (!baseUrl) {
        vscode.window.showErrorMessage('BASE_URL missing in config.');
        return;
      }

      const endpointPath = node.label;
      const url = new URL(endpointPath, baseUrl).toString();
      const endpoints = apiConfig.ENDPOINTS || {};
      const endpointConfig = endpoints[endpointPath] || {};
      const method = endpointConfig.METHOD || 'GET';
      const headers = { ...apiConfig.HEADERS, ...(endpointConfig.HEADERS || {}) };

      let body: string | undefined;
      if ((method === 'POST' || method === 'PUT') && endpointConfig.BODY_TEMPLATE) {
        body = JSON.stringify(endpointConfig.BODY_TEMPLATE);
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
      }

      const config = vscode.workspace.getConfiguration('feature-assured');
      const timeoutMs = config.get<number>('pingTimeout', 5000);

      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, { method, headers, body, signal: controller.signal });
      clearTimeout(timeoutId);
      const duration = Date.now() - start;

      if (response.ok)
        vscode.window.showInformationMessage(`✔️ ${method} ${endpointPath} OK (${response.status}) — ${duration}ms`);
      else
        vscode.window.showWarningMessage(`⚠️ ${method} ${endpointPath} failed: ${response.status} — ${duration}ms`);

      appendPingLog(`[Endpoint Ping] ${method} ${url} → ${response.status} (${duration}ms)`);
      updatePingLogsContext();
    } catch (err: any) {
      const msg = `Ping failed: ${err.message}`;
      vscode.window.showErrorMessage(msg);
      appendPingLog(`[Endpoint Ping Error] ${msg}`);
      updatePingLogsContext();
    }
  });

  context.subscriptions.push(disposable);
}
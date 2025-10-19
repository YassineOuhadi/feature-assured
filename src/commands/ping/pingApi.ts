import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { INodeItem, IRestEndpointConfig } from '../../types';
import { appendPingLog, pingOutputChannel, resetPingLogs, updatePingLogsContext } from './_pingUtils.ts';

export function registerPingApiCommand(context: vscode.ExtensionContext, workspaceFolders: readonly vscode.WorkspaceFolder[]) {
  const disposable = vscode.commands.registerCommand('extension.pingApi', async (node: INodeItem) => {
    resetPingLogs();
    if (!node || !node.tooltip || !node.description) {
      vscode.window.showErrorMessage('Invalid API node selected.');
      return;
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;
    const jsonPath = path.join(workspacePath, 'cypress', 'e2e', node.tooltip);
    if (!fs.existsSync(jsonPath)) {
      const msg = `API config file not found: ${jsonPath}`;
      vscode.window.showErrorMessage(msg);
      appendPingLog(`[ERROR] ${msg}`);
      return;
    }

    const apiName = node.label;
    const apiType = node.description?.toLowerCase();
    appendPingLog(`\n--- Pinging ${apiName} (${apiType}) ---`);
    pingOutputChannel.show(true);

    const config = vscode.workspace.getConfiguration('feature-assured');
    const timeoutMs = config.get<number>('pingTimeout', 5000);
    const maxRetries = config.get<number>('retryCount', 2);

    const progressMsg = `Pinging ${apiName}...`;
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: progressMsg, cancellable: false },
      async () => {
        try {
          const content = fs.readFileSync(jsonPath, 'utf-8');
          const apiConfig = JSON.parse(content);

          const attemptPing = async (attempt = 1): Promise<{ success: boolean; message: string; duration: number }> => {
            const start = Date.now();
            appendPingLog(`  Attempt ${attempt}...`);

            try {
              if (apiType === 'rest') {
                const baseUrlRaw = apiConfig.BASE_URL?.trim();
                if (!baseUrlRaw) throw new Error('Missing BASE_URL');
                const baseUrl = baseUrlRaw.replace(/\s+$/, '');

                appendPingLog(`    Pinging BASE_URL: ${baseUrl}`);
                let baseOk = false;
                try {
                  const controller = new AbortController();
                  const to = setTimeout(() => controller.abort(), timeoutMs);
                  const res = await fetch(baseUrl, {
                    method: 'GET',
                    headers: apiConfig.HEADERS || {},
                    signal: controller.signal
                  });
                  clearTimeout(to);
                  const baseDuration = Date.now() - start;
                  if (res.ok) {
                    appendPingLog(`    ✔️ BASE_URL OK (${res.status}) — ${baseDuration}ms`);
                    baseOk = true;
                  } else {
                    throw new Error(`HTTP ${res.status} ${res.statusText}`);
                  }
                } catch (e: any) {
                  const baseDuration = Date.now() - start;
                  const errMsg = e.message || 'Fetch error';
                  appendPingLog(`    ❌ BASE_URL failed: ${errMsg} (${baseDuration}ms)`);
                  throw new Error(`BASE_URL unreachable: ${errMsg}`);
                }

                const endpoints = apiConfig.ENDPOINTS || {};
                const endpointResults: { path: string; ok: boolean; duration: number; error?: string }[] = [];

                for (const [pathKey, endpointConfig] of Object.entries(endpoints)) {
                  const url = new URL(pathKey, baseUrl).toString();
                  const epConfig = endpointConfig as IRestEndpointConfig;
                  const method = epConfig.METHOD || 'GET';
                  const headers = { ...apiConfig.HEADERS, ...(epConfig.HEADERS || {}) };

                  let body: string | undefined;
                  if ((method === 'POST' || method === 'PUT') && epConfig.BODY_TEMPLATE) {
                    body = JSON.stringify(epConfig.BODY_TEMPLATE);
                    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
                  }

                  appendPingLog(`    Pinging endpoint: ${method} ${url}`);
                  const endpointStart = Date.now();
                  try {
                    const controller = new AbortController();
                    const to = setTimeout(() => controller.abort(), timeoutMs);
                    const res = await fetch(url, { method, headers, body, signal: controller.signal });
                    clearTimeout(to);
                    const dur = Date.now() - endpointStart;
                    if (res.ok) {
                      appendPingLog(`    ✔️ ${method} ${pathKey} OK (${res.status}) — ${dur}ms`);
                      endpointResults.push({ path: pathKey, ok: true, duration: dur });
                    } else {
                      const err = `HTTP ${res.status} ${res.statusText}`;
                      appendPingLog(`    ❌ ${method} ${pathKey} failed: ${err} — ${dur}ms`);
                      endpointResults.push({ path: pathKey, ok: false, duration: dur, error: err });
                    }
                  } catch (e: any) {
                    const dur = Date.now() - endpointStart;
                    const errMsg = e.message || 'Fetch error';
                    appendPingLog(`    ❌ ${method} ${pathKey} error: ${errMsg} — ${dur}ms`);
                    endpointResults.push({ path: pathKey, ok: false, duration: dur, error: errMsg });
                  }
                }

                const allEndpointsOk = endpointResults.every(r => r.ok);
                const totalDuration = Date.now() - start;
                if (baseOk && allEndpointsOk) {
                  return { success: true, message: `✔️ ${apiName} is fully UP — ${totalDuration}ms`, duration: totalDuration };
                } else {
                  const failedPaths = endpointResults.filter(r => !r.ok).map(r => r.path);
                  throw new Error(`Failed endpoints: ${failedPaths.join(', ')} (${totalDuration}ms)`);
                }
              }

              throw new Error(`Unsupported API type: ${apiType}`);

            } catch (err: any) {
              const duration = Date.now() - start;
              const errMsg = err.message || String(err);
              appendPingLog(`    ❌ Attempt ${attempt} failed after ${duration}ms: ${errMsg}`);
              if (attempt <= maxRetries) {
                appendPingLog(`    → Retrying in 1s...`);
                await new Promise(r => setTimeout(r, 1000));
                return attemptPing(attempt + 1);
              } else {
                return { success: false, message: `⚠️ ${apiName} DOWN — ${errMsg} (${duration}ms)`, duration };
              }
            }
          };

          const result = await attemptPing();
          if (result.success) vscode.window.showInformationMessage(result.message);
          else vscode.window.showWarningMessage(result.message);
          updatePingLogsContext();

        } catch (err: any) {
          const msg = `Fatal error pinging ${apiName}: ${err.message}`;
          appendPingLog(`[FATAL] ${msg}`);
          vscode.window.showErrorMessage(msg);
        }
      }
    );
  });

  context.subscriptions.push(disposable);
}
import * as vscode from 'vscode';

export let pingLogBuffer: string[] = [];
export let pingOutputChannel: vscode.OutputChannel;

export function initPingOutput(context: vscode.ExtensionContext) {
  pingOutputChannel = vscode.window.createOutputChannel('Cypress Generic: API Ping');
  context.subscriptions.push(pingOutputChannel);
}

export function appendPingLog(line: string) {
  const fullLine = `[${new Date().toISOString()}] ${line}`;
  pingLogBuffer.push(fullLine);
  pingOutputChannel.appendLine(fullLine);
}

export function updatePingLogsContext() {
  vscode.commands.executeCommand('setContext', 'cypressGeneric.hasPingLogs', pingLogBuffer.length > 0);
}

export function resetPingLogs() {
  pingLogBuffer = [];
  pingOutputChannel.clear();
  updatePingLogsContext();
}
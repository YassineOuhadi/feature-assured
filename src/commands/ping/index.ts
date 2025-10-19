import * as vscode from 'vscode';
import { registerPingApiCommand } from './pingApi';
import { registerPingEndpointCommand } from './pingEndpoint';
import { registerExportPingResultsCommand } from './exportPingResults';
import { initPingOutput } from './_pingUtils.ts';

export function initPingCommands(context: vscode.ExtensionContext, workspaceFolders: readonly vscode.WorkspaceFolder[]) {
  initPingOutput(context);
  registerPingApiCommand(context, workspaceFolders);
  registerPingEndpointCommand(context, workspaceFolders);
  registerExportPingResultsCommand(context, workspaceFolders);
}
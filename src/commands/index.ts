import * as vscode from 'vscode';
import { registerFileCommands } from './file';
import { initPingCommands } from './ping';
import { initRunCommands } from './run';
import { initStepCommands } from './step';
import {  } from './step';
import { initValidationCommands } from './validation';
import { FeatureReportDecorator } from '../editor/FeatureReportDecorator';
import { initReportCommands } from './report';
import { FeatureSpecsProvider } from '../editor/FeatureSpecsProvider';
import { registerFeatureRequestCommand } from './step/featureRequestCommand';

export function initAllCommands(
  context: vscode.ExtensionContext,
  treeProvider: any,
  workspaceFolders: readonly vscode.WorkspaceFolder[],
  reportDecorator: FeatureReportDecorator
) {

  // document commands
  registerFileCommands(context, treeProvider, workspaceFolders);

  // ping commands
  initPingCommands(context, workspaceFolders);

  // run commands
  initRunCommands(context, workspaceFolders, reportDecorator);

  // step commands
  initStepCommands(context);

  // validation commands
  initValidationCommands(context);

  // report commands
  initReportCommands(context);

  registerFeatureRequestCommand(context)
}
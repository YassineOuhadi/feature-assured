import * as vscode from 'vscode';
import { registerOpenStepFileCommand } from './openStepFile';
import { registerFeatureRequestCommand } from './featureRequestCommand';

export function initStepCommands(context: vscode.ExtensionContext) {
  registerOpenStepFileCommand(context);
}
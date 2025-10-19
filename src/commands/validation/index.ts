import * as vscode from 'vscode';
import { registerValidatePageSchemaCommand } from './validatePageSchema';
import { registerValidateServiceSchemaCommand } from './validateServiceSchema';

export function initValidationCommands(context: vscode.ExtensionContext) {
  registerValidatePageSchemaCommand(context);
  registerValidateServiceSchemaCommand(context);
}

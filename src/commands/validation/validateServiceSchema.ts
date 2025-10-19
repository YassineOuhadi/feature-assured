import * as vscode from 'vscode';
import { validateJsonSchema } from '../../utils/schemaValidator';

export function registerValidateServiceSchemaCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'extension.validateServiceSchema',
    (document: vscode.TextDocument, type: string) => {
      if (!document || !type) return;
      validateJsonSchema(document, type);
    }
  );

  context.subscriptions.push(disposable);
}
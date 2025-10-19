import * as vscode from 'vscode';
import { validateJsonSchema } from '../../utils/schemaValidator';

export function registerValidatePageSchemaCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.validatePageSchema', (document: vscode.TextDocument) => {
    if (!document) return;
    validateJsonSchema(document, 'page');
  });

  context.subscriptions.push(disposable);
}

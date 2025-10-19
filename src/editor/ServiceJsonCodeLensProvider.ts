import * as vscode from 'vscode';
import { getRegistryFileTypeMap, getRelativePathFromE2e } from '../utils/registryUtils';

export class ServiceJsonCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const relPath = getRelativePathFromE2e(document.uri.fsPath);
    const registryMap = getRegistryFileTypeMap();
    const type = registryMap["./" + relPath];
    if (type && ['rest', 'graphql', 'soap', 'websocket'].includes(type)) {
      return [new vscode.CodeLens(
        new vscode.Range(0, 0, 0, 0),
        {
          title: `▶ Validate ${type.toUpperCase()} Schema`,
          command: 'extension.validateServiceSchema',
          arguments: [document, type]
        }
      )];
    }
    return [];
  }
}
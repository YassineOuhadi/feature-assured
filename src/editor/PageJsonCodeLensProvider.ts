import * as vscode from 'vscode';
import { getRegistryFileTypeMap, getRelativePathFromE2e } from '../utils/registryUtils';

export class PageJsonCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const relPath = getRelativePathFromE2e(document.uri.fsPath);
    const registryMap = getRegistryFileTypeMap();
    if (registryMap["./" + relPath] === 'page') {
      return [new vscode.CodeLens(
        new vscode.Range(0, 0, 0, 0),
        {
          title: '▶ Validate Page Schema',
          command: 'extension.validatePageSchema',
          arguments: [document]
        }
      )];
    }
    return [];
  }
}
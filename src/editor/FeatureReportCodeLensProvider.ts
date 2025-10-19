import * as vscode from 'vscode';
import { FeatureResult } from '../utils/reportUtils';

export class FeatureReportCodeLensProvider implements vscode.CodeLensProvider {
  private features: FeatureResult[] = [];
  private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;

  public refresh(features: FeatureResult[]) {
    this.features = features;
    this.onDidChangeCodeLensesEmitter.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const filePath = document.uri.fsPath;

    const feature = this.features.find(f => filePath.endsWith(f.uri));
    if (!feature) return lenses;

    const lines = document.getText().split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^\s*(Given|When|Then|And|But)\s+(.*)$/);
      if (!match) continue;

      const stepText = match[2].trim();
      const step = feature.scenarios.flatMap(s => s.steps).find(s => s.name === stepText);
      if (step?.status === 'failed' && step.data && step.mime_type?.startsWith('image/')) {
        const range = new vscode.Range(i, 0, i, line.length);
        lenses.push(
          new vscode.CodeLens(range, {
            title: '👁 View Screenshot',
            tooltip: 'Open the failed step screenshot',
            command: 'featureAssured.viewScreenshot',
            arguments: [step]
          })
        );
      }
    }

    return lenses;
  }
}
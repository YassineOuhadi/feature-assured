import * as vscode from 'vscode';
import { FeatureDiagnostics } from './FeatureDiagnostics';

export class FeatureCodeLensProvider implements vscode.CodeLensProvider {
  private diagnostics: FeatureDiagnostics;
  private onDidChangeEmitter = new vscode.EventEmitter<void>();
  private runningFiles = new Set<string>();

  onDidChangeCodeLenses = this.onDidChangeEmitter.event;

  constructor(diagnostics: FeatureDiagnostics) {
    this.diagnostics = diagnostics;
  }

  markRunning(file: string, isRunning: boolean) {
    if (isRunning) this.runningFiles.add(file);
    else this.runningFiles.delete(file);
    this.onDidChangeEmitter.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];
    const topOfFile = new vscode.Range(0, 0, 0, 0);

    const isRunning = this.runningFiles.has(document.fileName);

    lenses.push(
      new vscode.CodeLens(topOfFile, {
        title: isRunning ? '⏳ Running Feature...' : '▶ Run Feature with Generic Package',
        command: 'extension.runFeature',
        arguments: isRunning ? [] : [document.fileName],
      })
    );

    const steps = this.diagnostics.getStepsForDocument(document);
    for (const step of steps) {
      const range = new vscode.Range(step.line, 0, step.line, 0);
      lenses.push(
        new vscode.CodeLens(range, {
          title: step.implemented ? '✔️ Implemented' : '❌ Undefined',
          command: step.implemented ? '' : 'featureAssured.openProblems',
        })
      );
    }

    return lenses;
  }
}
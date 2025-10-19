import * as vscode from 'vscode';
import * as path from 'path';
import { loadCucumberReport, FeatureResult, showFailedStepDialog } from '../utils/reportUtils';
import { FeatureReportCodeLensProvider } from './FeatureReportCodeLensProvider';

export class FeatureReportDecorator {
  private workspaceRoot: string;
  private decorations: vscode.TextEditorDecorationType[] = [];
  private features: FeatureResult[] = [];
  private runningFile: string | null = null;

  private featureReportCodeLensProvider: FeatureReportCodeLensProvider | null = null;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  public refreshReport() {
    this.features = loadCucumberReport(this.workspaceRoot);
  }

  public getFeatures() {
    return this.features;
  }

  public setRunningFeature(filePath: string | null) {
    this.runningFile = filePath;
  }

  public setReportProvider(reportProvider: FeatureReportCodeLensProvider) {
    this.featureReportCodeLensProvider = reportProvider;
  }

  public async applyDecorations(editor: vscode.TextEditor) {
    if (!editor.document.fileName.endsWith('.feature')) return;

    const fileUri = path.relative(this.workspaceRoot, editor.document.fileName);
    const feature = this.features.find(f => f.uri.endsWith(fileUri));
    if (!feature) return;

    // clear previous
    this.decorations.forEach(d => d.dispose());
    this.decorations = [];

    const successDeco = vscode.window.createTextEditorDecorationType({
      isWholeLine: false,
      after: { contentText: ' ✅', color: '#00cc66' },
    });

    const failedDeco = vscode.window.createTextEditorDecorationType({
      isWholeLine: false,
      after: { contentText: ' ❌', color: '#ff5555' },
    });

    const pendingDeco = vscode.window.createTextEditorDecorationType({
      isWholeLine: false,
      after: { contentText: ' ⏳', color: '#ffaa00' },
    });

    const successRanges: vscode.DecorationOptions[] = [];
    const failedRanges: vscode.DecorationOptions[] = [];
    const pendingRanges: vscode.DecorationOptions[] = [];

    const text = editor.document.getText().split(/\r?\n/);

    // if running
    if (this.runningFile && editor.document.fileName.endsWith(this.runningFile)) {
      const runningDeco = vscode.window.createTextEditorDecorationType({
        isWholeLine: false,
        after: { contentText: ' ⏳ Running...', color: '#ffaa00' },
      });
      const range = new vscode.Range(0, 0, 0, 0);
      editor.setDecorations(runningDeco, [{ range }]);
      this.decorations.push(runningDeco);
      return;
    }

    for (let i = 0; i < text.length; i++) {
      const line = text[i];
      const match = line.match(/^\s*(Given|When|Then|And|But)\s+(.*)$/);
      if (!match) continue;

      const stepText = match[2].trim();
      const step = feature.scenarios.flatMap(s => s.steps).find(s => s.name === stepText);
      if (!step) continue;

      const range = new vscode.Range(i, 0, i, line.length);

      // base hover info
      const hoverMessage = step.status === 'failed'
        ? new vscode.MarkdownString(`**❌ Failed Step:** ${step.name}\n\n\`\`\`\n${step.error_message || 'No error message'}\n\`\`\`\n`)
        : new vscode.MarkdownString(`**${step.status.toUpperCase()}**`);

      // if (step.data && step.mime_type?.startsWith('image/')) {
      //   hoverMessage.appendMarkdown(`\n\n![screenshot](data:${step.mime_type};base64,${step.data})`);
      // }

      const decoration: vscode.DecorationOptions = { range, hoverMessage };

      if (step.status === 'passed') successRanges.push(decoration);
      else if (step.status === 'failed') {
        failedRanges.push(decoration);
      } else pendingRanges.push(decoration);
    }

    editor.setDecorations(successDeco, successRanges);
    editor.setDecorations(failedDeco, failedRanges);
    editor.setDecorations(pendingDeco, pendingRanges);

    this.decorations.push(successDeco, failedDeco, pendingDeco);

    //
    this.featureReportCodeLensProvider?.refresh(this.features);
  }
}

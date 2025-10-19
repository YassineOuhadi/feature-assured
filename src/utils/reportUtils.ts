import * as fs from 'fs';
import * as path from 'path';

export interface StepResult {
    keyword: string;
    name: string;
    status: string;
    duration?: number;
    error_message?: string;
    data?: string;
    mime_type?: string;
}

export interface ScenarioResult {
    name: string;
    steps: StepResult[];
}

export interface FeatureResult {
    uri: string;
    name: string;
    scenarios: ScenarioResult[];
}

export function loadCucumberReport(workspaceRoot: string): FeatureResult[] {
    const reportPath = path.join(workspaceRoot, 'cypress/reports/json/cucumber-report.json');
    if (!fs.existsSync(reportPath)) return [];

    try {
        const content = fs.readFileSync(reportPath, 'utf8');
        const json = JSON.parse(content);

        return json.map((feature: any) => ({
            uri: feature.uri,
            name: feature.name,
            scenarios: feature.elements.map((el: any) => ({
                name: el.name,
                steps: el.steps.map((s: any) => ({
                    keyword: s.keyword.trim(),
                    name: s.name,
                    status: s.result?.status || 'unknown',
                    duration: s.result?.duration,
                    error_message: s.result?.error_message,
                    data: s.embeddings?.[0]?.data,
                    mime_type: s.embeddings?.[0]?.mime_type
                })),
            })),
        }));
    } catch (err) {
        console.error('Error parsing report:', err);
        return [];
    }
}

import * as vscode from 'vscode';

export function showFailedStepDialog(message: string) {
  const imageRegex = /!\[.*?\]\((data:image\/png;base64,[^)]+)\)/;
  const match = message.match(imageRegex);

  if (match) {
    const base64 = match[1];
    const html = `
      <html>
        <body style="background-color:#1e1e1e; display:flex; flex-direction:column; align-items:center; padding:1rem;">
          <h2 style="color:#e51400;">❌ Failed Step</h2>
          <p style="color:#ccc;">Expected text not found in response</p>
          <img src="${base64}" style="max-width:95%; border-radius:8px; border:1px solid #333;"/>
        </body>
      </html>
    `;
    const panel = vscode.window.createWebviewPanel(
      'failedStepPreview',
      '❌ Failed Step Screenshot',
      vscode.ViewColumn.One,
      { enableScripts: false }
    );
    panel.webview.html = html;
  } else {
    vscode.window.showErrorMessage(message);
  }
}
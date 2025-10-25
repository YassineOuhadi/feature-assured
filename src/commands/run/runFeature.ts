import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getFeatureAssuredTerminal } from '../../utils/terminalManager';
import { initProjectIfNeeded } from './initProjectIfNeeded';
import { FeatureReportDecorator } from '../../editor/FeatureReportDecorator';

export async function runFeatureCommand(
  filePath: string,
  workspaceFolders: readonly vscode.WorkspaceFolder[],
  reportDecorator?: FeatureReportDecorator
) {
  if (!filePath) return;
  if (!(await initProjectIfNeeded(workspaceFolders))) return;

  const projectPath = workspaceFolders[0].uri.fsPath;
  const relativePath = path.relative(projectPath, filePath).replace(/\\/g, '/');

  reportDecorator?.setRunningFeature(filePath);
  const editor = vscode.window.activeTextEditor;
  if (editor) reportDecorator?.applyDecorations(editor);

  const terminal = getFeatureAssuredTerminal();
  terminal.show();
  terminal.sendText(
    `npm run test:full -- --spec '${relativePath}'`
  );

  const reportPath = path.join(projectPath, 'cypress/reports/json/cucumber-report.json');
  const checkInterval = setInterval(() => {
    if (fs.existsSync(reportPath)) {
      clearInterval(checkInterval);
      try {
        reportDecorator?.refreshReport();
        reportDecorator?.setRunningFeature(null);
        if (editor) reportDecorator?.applyDecorations(editor);
      } catch (err) {
        console.error('Error refreshing report:', err);
      }
    }
  }, 2000);
}
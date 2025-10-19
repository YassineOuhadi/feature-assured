import * as vscode from 'vscode';
import { ExplorerTreeProvider } from './editor/ExplorerTreeProvider';
import { createWatchers } from './utils/watcherUtils';
import { buildRegistryFileTypeMap } from './utils/registryUtils';
import { runCLIAndExtractJSON } from './utils/runCLI';
import { FeatureCodeLensProvider } from './editor/FeatureCodeLensProvider';
import { ServiceJsonCodeLensProvider } from './editor/ServiceJsonCodeLensProvider';
import { PageJsonCodeLensProvider } from './editor/PageJsonCodeLensProvider';
import { FeatureSpecsProvider } from './editor/FeatureSpecsProvider';
import { FeatureDiagnostics } from './editor/FeatureDiagnostics';
import { FeatureValidationProvider } from './editor/FeatureValidationProvider';
import { initAllCommands } from './commands';

import { FeatureReportDecorator } from './editor/FeatureReportDecorator';

import { FeatureReportCodeLensProvider } from './editor/FeatureReportCodeLensProvider';


import * as chokidar from 'chokidar';
import path from 'path';

export async function activate(context: vscode.ExtensionContext) {
  console.log('🧩 Feature Assured extension activated');

  // ------------------------------
  // Load steps from CLI
  // ------------------------------
  const output = await runCLIAndExtractJSON();
  if (!output) vscode.window.showErrorMessage('❌ Failed to load steps: No JSON found in CLI output');

  const specsProvider = new FeatureSpecsProvider(output || []);
  vscode.window.registerTreeDataProvider('featureSpecs', specsProvider);

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders?.length) return;
  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  // Feature report decorator
  const reportDecorator = new FeatureReportDecorator(workspaceRoot);

  const reportCodeLensProvider = new FeatureReportCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/*.feature' },
      reportCodeLensProvider
    )
  );

  reportDecorator.setReportProvider(reportCodeLensProvider);

  // ------------------------------
  // Registry Tree and Watchers
  // ------------------------------
  const registryTreeProvider = new ExplorerTreeProvider(workspaceRoot);
  createWatchers(workspaceRoot, registryTreeProvider, context);
  vscode.window.registerTreeDataProvider('cypressGenericExplorer', registryTreeProvider);

  function updateWelcomeViewContext() {
    vscode.commands.executeCommand('setContext', 'cypressGenericExplorerEmpty', registryTreeProvider.isEmpty());
  }

  const originalRefresh = registryTreeProvider.refresh.bind(registryTreeProvider);
  registryTreeProvider.refresh = () => {
    originalRefresh();
    updateWelcomeViewContext();
  };
  updateWelcomeViewContext();

  // ------------------------------
  // Validation Setup
  // ------------------------------
  const featureDiagnostics = new FeatureDiagnostics(workspaceRoot);
  featureDiagnostics.activate(context);
  const validateFeatureProvider = new FeatureValidationProvider(featureDiagnostics);

  const validateView = vscode.window.createTreeView('validateFeature', {
    treeDataProvider: validateFeatureProvider,
    showCollapseAll: false
  });
  context.subscriptions.push(validateView);

  const validateCmd = vscode.commands.registerCommand('featureAssured.validateFeature', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor?.document.fileName.endsWith('.feature')) {
      vscode.window.showInformationMessage('Open a .feature file first.');
      return;
    }
    validateFeatureProvider.refresh();
    vscode.commands.executeCommand('workbench.view.featureAssured');
  });
  context.subscriptions.push(validateCmd);

  // ------------------------------
  // Register CodeLens Providers
  // ------------------------------
  const featureLensProvider = new FeatureCodeLensProvider(featureDiagnostics);

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/*.feature' },
      featureLensProvider
    ),
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/cypress/e2e/**/*.json' },
      new PageJsonCodeLensProvider()
    ),
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/cypress/e2e/**/*.json' },
      new ServiceJsonCodeLensProvider()
    )
  );

  // ------------------------------
  // Initialize all commands
  // ------------------------------
  initAllCommands(context, registryTreeProvider, workspaceFolders, reportDecorator);

  buildRegistryFileTypeMap(workspaceRoot);

  // ------------------------------
  // Refresh specs
  // ------------------------------
  const refreshCmd = vscode.commands.registerCommand('featureAssured.refreshSpecs', async () => {
    const data = await runCLIAndExtractJSON();
    specsProvider.refresh(data || []);
    vscode.window.showInformationMessage('🔄 Specs refreshed!');
  });
  context.subscriptions.push(refreshCmd);


  // ------------------------------
  // Report Decorations
  // ------------------------------
  reportDecorator.refreshReport();
  reportCodeLensProvider.refresh(reportDecorator.getFeatures());

  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) reportDecorator.applyDecorations(editor);
  }, null, context.subscriptions);

  const reportPath = path.join(workspaceRoot, 'cypress/reports/json/cucumber-report.json');
  const watcher = chokidar.watch(reportPath, { ignoreInitial: false });

  watcher.on('change', () => {
    reportDecorator.refreshReport();

    // force refresh of code lens provider
    reportCodeLensProvider.refresh(reportDecorator.getFeatures());

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      reportDecorator.applyDecorations(editor);

      vscode.commands.executeCommand('editor.action.codelens.refresh');
    }
  });

  context.subscriptions.push({ dispose: () => watcher.close() });

  if (vscode.window.activeTextEditor) {
    reportDecorator.applyDecorations(vscode.window.activeTextEditor);
  }
}

export function deactivate() { }
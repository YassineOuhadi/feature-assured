import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function registerOpenSchemaCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('extension.openSchema', async () => {
    try {
      const schemasPath = path.join(context.extensionPath, 'resources', 'schemas');
      if (!fs.existsSync(schemasPath)) {
        vscode.window.showErrorMessage('No schemas found in resources/schemas.');
        return;
      }

      const files = fs.readdirSync(schemasPath).filter(f => f.endsWith('.json'));
      if (files.length === 0) {
        vscode.window.showWarningMessage('No schema files found.');
        return;
      }

      const choice = await vscode.window.showQuickPick(files, {
        placeHolder: 'Select a schema to view',
      });
      if (!choice) return;

      const schemaPath = path.join(schemasPath, choice);
      const content = fs.readFileSync(schemaPath, 'utf-8');
      const parsed = JSON.parse(content);

      const panel = vscode.window.createWebviewPanel(
        'jsonSchemaViewer',
        `Schema: ${choice}`,
        vscode.ViewColumn.One,
        { 
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'resources'))]
        }
      );

      const jsonContent = JSON.stringify(parsed, null, 2)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      panel.webview.html = getSchemaWebviewContent(jsonContent, choice, panel.webview, context);
    } catch (err) {
      vscode.window.showErrorMessage(`Error loading schema: ${(err as Error).message}`);
    }
  });

  context.subscriptions.push(command);
}

function getSchemaWebviewContent(
  jsonContent: string,
  title: string,
  webview: vscode.Webview,
  context: vscode.ExtensionContext
): string {
  const codiconsUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css')
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link href="${codiconsUri}" rel="stylesheet">
<style>
  :root {
    --vscode-editor-background: var(--vscode-editor-background);
    --vscode-editor-foreground: var(--vscode-editor-foreground);
    --vscode-editor-border: var(--vscode-editorGroup-border);
    --vscode-editor-selectionBackground: var(--vscode-editor-selectionBackground);
    --vscode-editor-hoverHighlight: var(--vscode-editor-hoverHighlight);
  }

  body {
    font-family: Consolas, 'Courier New', monospace;
    margin: 0;
    padding: 16px;
    background-color: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
  }

  h2 {
    font-size: 1.2rem;
    margin-bottom: 12px;
    color: var(--vscode-editor-foreground);
  }

  pre {
    background-color: var(--vscode-editor-hoverHighlight);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
</head>
<body>
  <div class="container">
    <h2>${title}</h2>
    <pre>${jsonContent}</pre>
  </div>
</body>
</html>`;
}
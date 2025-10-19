import * as vscode from 'vscode';

export function registerOpenStepFileCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.openStepFile', async (definition: string) => {
    if (!definition) return;

    const [filePath, lineStr, colStr] = definition.split(':');
    const line = parseInt(lineStr, 10) - 1;
    const col = parseInt(colStr, 10) - 1;

    try {
      const doc = await vscode.workspace.openTextDocument(filePath);
      const editor = await vscode.window.showTextDocument(doc);
      const pos = new vscode.Position(line, col);
      editor.selection = new vscode.Selection(pos, pos);
      editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Cannot open step file: ${err.message}`);
    }
  });

  context.subscriptions.push(disposable);
}
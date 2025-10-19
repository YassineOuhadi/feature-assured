import * as vscode from 'vscode';

let featureAssuredTerminal: vscode.Terminal | undefined;

export function getFeatureAssuredTerminal(): vscode.Terminal {
  if (!featureAssuredTerminal) {
    featureAssuredTerminal = vscode.window.terminals.find(t => t.name === 'Feature Assured') 
                             || vscode.window.createTerminal('Feature Assured Runner');
  }
  return featureAssuredTerminal;
}

vscode.window.onDidCloseTerminal((closedTerminal) => {
  if (closedTerminal === featureAssuredTerminal) {
    featureAssuredTerminal = undefined;
  }
});
import * as vscode from 'vscode';
import { Octokit } from 'octokit';

export function registerFeatureRequestCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'featureAssured.requestNewFeature',
    async () => {
      const featureTitle = await vscode.window.showInputBox({
        prompt: 'Enter a short title for the feature request',
        placeHolder: 'e.g. Add support for new REST API step'
      });
      if (!featureTitle) return;

      const featureBody = await vscode.window.showInputBox({
        prompt: 'Describe the feature in detail',
        placeHolder: 'Detailed description, use cases, expected behavior...'
      });
      if (!featureBody) return;

      try {
        const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
        const octokit = new Octokit({ auth: session.accessToken });

        await octokit.request('POST /repos/{owner}/{repo}/issues', {
          owner: 'YassineOuhadi',
          repo: 'cypress-generic-package',
          title: featureTitle,
          body: featureBody
        });

        vscode.window.showInformationMessage('Feature request submitted successfully!');
      } catch (err: any) {
        vscode.window.showErrorMessage(`❌ Failed to create feature request: ${err.message}`);
        console.error(err);
      }
    }
  );

  context.subscriptions.push(disposable);
}

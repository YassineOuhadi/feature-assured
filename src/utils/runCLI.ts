import * as vscode from 'vscode';
import { exec } from 'child_process';

export async function runCLIAndExtractJSON(): Promise<any[] | null> {
    return new Promise((resolve) => {
        const cmd = 'npx feature-assured list-steps --json';
        const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        exec(cmd, { cwd }, (error, stdout) => {
            if (error) {
                console.error('Error running CLI:', error);
                vscode.window.showErrorMessage(`Feature Assured CLI error: ${error.message}`);
                return resolve(null);
            }

            try {
                const match = stdout.match(/\{[\s\S]*\}/);
                if (!match) return resolve(null);
                const data = JSON.parse(match[0]);
                resolve(data);
            } catch (e) {
                console.error('Failed to parse JSON output:', e);
                resolve(null);
            }
        });
    });
}

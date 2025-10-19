import * as vscode from 'vscode';
import { execSync } from 'child_process';

export class FeatureDiagnostics {
    private collection: vscode.DiagnosticCollection;
    private workspaceRoot: string;
    private compiledLibrary: Array<{ category: string; entry: any; regex: RegExp | null }> = [];
    private lastLoadedAt = 0;
    private statusBarItem: vscode.StatusBarItem;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.collection = vscode.languages.createDiagnosticCollection('featureAssured');
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.tooltip = 'Feature Assured: Step Definition Status';
    }

    public activate(context: vscode.ExtensionContext) {
        context.subscriptions.push(this.collection, this.statusBarItem);

        vscode.workspace.onDidOpenTextDocument(this.onDocChanged, this, context.subscriptions);
        vscode.workspace.onDidSaveTextDocument(this.onDocChanged, this, context.subscriptions);
        vscode.workspace.onDidCloseTextDocument(doc => this.collection.delete(doc.uri), null, context.subscriptions);
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor?.document) this.onDocChanged(editor.document);
        });

        this.reloadStepsLibrary();

        const openProblemsCmd = vscode.commands.registerCommand('featureAssured.openProblems', () => {
            vscode.commands.executeCommand('workbench.actions.view.problems');
        });
        context.subscriptions.push(openProblemsCmd);

        // make status bar clickable
        this.statusBarItem.command = 'featureAssured.openProblems';
    }

    private reloadStepsLibrary() {
        const now = Date.now();
        if (now - this.lastLoadedAt < 1000) return;
        this.lastLoadedAt = now;

        try {
            const raw = execSync('npx feature-assured list-steps --json', {
                cwd: this.workspaceRoot,
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024,
            }).toString();

            const clean = raw.replace(/\u001b\[[0-9;]*m/g, '');
            const jsonStart = clean.indexOf('{');
            const jsonEnd = clean.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) {
                this.compiledLibrary = [];
                return;
            }

            const jsonText = clean.substring(jsonStart, jsonEnd + 1);
            const library = JSON.parse(jsonText);

            const compiled: Array<{ category: string; entry: any; regex: RegExp | null }> = [];
            for (const [category, arr] of Object.entries(library)) {
                if (!Array.isArray(arr)) continue;
                for (const entry of arr as any[]) {
                    const patternText: string = entry.step || '';
                    let re: RegExp | null = null;
                    try {
                        const slashForm = patternText.match(/^\/(.+)\/([gimsuy]*)$/);
                        if (slashForm) re = new RegExp(slashForm[1], slashForm[2]);
                        else re = new RegExp('^' + patternText + '$');
                    } catch {
                        try {
                            re = new RegExp(patternText);
                        } catch {
                            re = null;
                        }
                    }
                    compiled.push({ category, entry, regex: re });
                }
            }

            this.compiledLibrary = compiled;
        } catch (err: any) {
            this.compiledLibrary = [];
            console.warn('FeatureDiagnostics: could not load steps library:', err?.message || err);
        }
    }

    private onDocChanged(doc: vscode.TextDocument) {
        if (!doc.fileName.endsWith('.feature')) return;

        this.reloadStepsLibrary();

        const diagnostics: vscode.Diagnostic[] = [];
        const lines = doc.getText().split(/\r?\n/);
        const stepRegex = /^\s*(Given|When|Then|And|But)\s+(.+)$/;
        let undefinedCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(stepRegex);
            if (!match) continue;
            const stepText = match[2].trim();

            let implemented = false;
            for (const item of this.compiledLibrary) {
                if (item.regex && item.regex.test(stepText)) {
                    implemented = true;
                    break;
                }
            }

            if (!implemented) {
                undefinedCount++;
                const range = new vscode.Range(i, match[1].length + 1, i, lines[i].length);
                const diag = new vscode.Diagnostic(range, `❌ Undefined step: ${stepText}`, vscode.DiagnosticSeverity.Warning);
                diag.source = 'Feature Assured';
                diagnostics.push(diag);
            }
        }

        this.collection.set(doc.uri, diagnostics);

        // update status bar summary
        if (undefinedCount > 0) {
            this.statusBarItem.text = `$(alert) ${undefinedCount} undefined step${undefinedCount > 1 ? 's' : ''}`;
            this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
            this.statusBarItem.tooltip = 'Click to open Problems panel';
        } else {
            this.statusBarItem.text = `$(check) All steps implemented`;
            this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
            this.statusBarItem.tooltip = 'All steps are implemented correctly';
        }
        this.statusBarItem.show();
    }

    // returns an array of steps with implemented status
    public getStepsForDocument(doc: vscode.TextDocument) {
        const lines = doc.getText().split(/\r?\n/);
        const stepRegex = /^\s*(Given|When|Then|And|But)\s+(.+)$/;
        const steps: { keyword: string; text: string; implemented: boolean; line: number }[] = [];

        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(stepRegex);
            if (!match) continue;
            const stepText = match[2].trim();
            let implemented = false;
            for (const item of this.compiledLibrary) {
                if (item.regex && item.regex.test(stepText)) {
                    implemented = true;
                    break;
                }
            }
            steps.push({ keyword: match[1], text: stepText, implemented, line: i });
        }

        return steps;
    }
}

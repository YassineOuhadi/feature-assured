import * as vscode from 'vscode';
import { FeatureDiagnostics } from './FeatureDiagnostics';

export class FeatureValidationProvider implements vscode.TreeDataProvider<TreeStepItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeStepItem | undefined> =
        new vscode.EventEmitter<TreeStepItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TreeStepItem | undefined> =
        this._onDidChangeTreeData.event;

    private currentDoc?: vscode.TextDocument;
    private diagnostics: FeatureDiagnostics;

    constructor(diagnostics: FeatureDiagnostics) {
    this.diagnostics = diagnostics;

    // if there is already an active editor when extension activates
    const editor = vscode.window.activeTextEditor;
    if (editor?.document?.fileName.endsWith('.feature')) {
        this.currentDoc = editor.document;
    }

    // update tree when active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor?.document?.fileName.endsWith('.feature')) {
            this.currentDoc = editor.document;
            this.refresh();
        }
    });

    // update tree when file saved
    vscode.workspace.onDidSaveTextDocument(doc => {
        if (doc.fileName.endsWith('.feature')) {
            this.currentDoc = doc;
            this.refresh();
        }
    });
}

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: TreeStepItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeStepItem): Thenable<TreeStepItem[]> {
        if (!this.currentDoc) return Promise.resolve([]);
        const steps = this.diagnostics.getStepsForDocument(this.currentDoc);

        if (!element) {
            // Root: list all steps
            return Promise.resolve(
                steps.map(step => {
                    const icon = step.implemented ? '✔️' : '❌';
                    const item = new TreeStepItem(`${icon} ${step.keyword} ${step.text}`, step.implemented, step.line);
                    item.command = {
                        command: 'vscode.open',
                        title: 'Go to step',
                        arguments: [this.currentDoc!.uri, { selection: new vscode.Range(step.line, 0, step.line, 0) }]
                    };
                    return item;
                })
            );
        }

        return Promise.resolve([]);
    }
}

export class TreeStepItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly implemented: boolean,
        public readonly line: number
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
    }
}

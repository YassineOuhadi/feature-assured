import * as vscode from 'vscode';
import { ExplorerTreeProvider } from '../../editor/ExplorerTreeProvider';
import { registerOpenJsonFile } from './openJsonFile';
import { registerRefreshExplorer } from './refreshExplorer';
import { registerAddChildNode } from './addChildNode';
import { registerShowExamples } from './showExamples';
import { registerOpenSchemaCommand } from './openSchema';

export function registerFileCommands(
    context: vscode.ExtensionContext,
    treeProvider: ExplorerTreeProvider,
    workspaceFolders: readonly vscode.WorkspaceFolder[]
) {
    registerOpenJsonFile(context, workspaceFolders);
    registerRefreshExplorer(context, treeProvider);
    registerAddChildNode(context, treeProvider);
    registerShowExamples(context, workspaceFolders);
    registerOpenSchemaCommand(context);

}
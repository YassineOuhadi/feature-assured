import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { INodeItem } from '../types';

const NODE_LABELS: Record<string, string> = {
    'ui': 'UI Components',
    'service': 'Service Models',
    'http': 'HTTP',
    'realtime': 'Realtime'
};

export class ExplorerTreeProvider implements vscode.TreeDataProvider<INodeItem> {
    private registry: { fileName: string; data: any }[] = [];

    private _onDidChangeTreeData: vscode.EventEmitter<INodeItem | null | undefined> =
        new vscode.EventEmitter<INodeItem | null | undefined>();
    readonly onDidChangeTreeData: vscode.Event<INodeItem | null | undefined> =
        this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string) {
        this.loadRegistry();
    }

    isEmpty(): boolean {
        return this.registry.length === 0;
    }

    refresh(): void {
        this.loadRegistry();
        this._onDidChangeTreeData.fire(null);

        vscode.commands.executeCommand('setContext', 'cypressGenericExplorerEmpty', this.isEmpty());
    }

    private loadRegistry() {
        const envDir = path.join(this.workspaceRoot, 'cypress', 'env');
        this.registry = [];

        if (!fs.existsSync(envDir)) {
            return;
        }

        const files = fs.readdirSync(envDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(envDir, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const data = JSON.parse(content);
                    this.registry.push({ fileName: file, data });
                } catch (e) {
                    console.error(`Failed to parse ${file}:`, e);
                    vscode.window.showErrorMessage(`Invalid JSON in cypress/env/${file}`);
                }
            }
        }
    }

    getTreeItem(element: INodeItem): vscode.TreeItem {
        if (element.contextValue === 'projectNode') {
            const treeItem = new vscode.TreeItem(
                element.label,
                vscode.TreeItemCollapsibleState.Collapsed
            );
            treeItem.description = element.description;
            treeItem.tooltip = `Project: ${element.tooltip}`;
            treeItem.contextValue = 'projectNode';
            treeItem.iconPath = new vscode.ThemeIcon('project');
            return treeItem;
        }

        const collapsibleState = (element.children && element.children.length > 0)
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;

        const treeItem = new vscode.TreeItem(element.label, collapsibleState);

        if (element.description) treeItem.description = element.description;
        if (element.tooltip) treeItem.tooltip = element.tooltip;

        if (element.label === "UI Components") {
            treeItem.iconPath = new vscode.ThemeIcon('symbol-class');
        } else if (element.label === "Service Models") {
            treeItem.iconPath = new vscode.ThemeIcon('server');
        } else {
            switch (element.contextValue || element.description?.toLowerCase()) {
                case "pageNode":
                case "page":
                    treeItem.contextValue = "pageNode";
                    treeItem.iconPath = new vscode.ThemeIcon('file');
                    break;
                case "menuNode":
                case "menu":
                    treeItem.contextValue = "menuNode";
                    treeItem.iconPath = new vscode.ThemeIcon('list-unordered');
                    break;
                case "formNode":
                case "form":
                    treeItem.contextValue = "formNode";
                    treeItem.iconPath = new vscode.ThemeIcon('symbol-interface');
                    break;
                case "fieldNode":
                case "field":
                    treeItem.contextValue = "fieldNode";
                    treeItem.iconPath = new vscode.ThemeIcon('symbol-field');
                    break;
                case "buttonNode":
                case "button":
                    treeItem.contextValue = "buttonNode";
                    treeItem.iconPath = new vscode.ThemeIcon('symbol-event');
                    break;
                case "serviceNode":
                case "rest":
                case "graphql":
                case "soap":
                case "websocket":
                    treeItem.contextValue = "serviceNode";
                    treeItem.iconPath = new vscode.ThemeIcon('server');
                    break;
                case "endpointNode":
                case "endpoint":
                    treeItem.contextValue = "endpointNode";
                    treeItem.iconPath = new vscode.ThemeIcon('symbol-key');
                    break;
                case "selectorNode":
                    treeItem.contextValue = "selectorNode";
                    treeItem.iconPath = new vscode.ThemeIcon('search');
                    break;
                default:
                    if (element.children && element.children.length > 0) {
                        treeItem.iconPath = new vscode.ThemeIcon('folder');
                    } else {
                        treeItem.iconPath = new vscode.ThemeIcon('file');
                    }
            }
        }

        if ((element.contextValue === 'pageNode' || element.contextValue === 'serviceNode') && element.tooltip) {
            treeItem.command = {
                command: 'featureAssured.openJsonFile',
                title: 'Open JSON File',
                arguments: [element]
            };
        }

        return treeItem;
    }

    getChildren(element?: INodeItem): INodeItem[] {
        if (!element) {
            return this.registry.map(proj => {
                const name = proj.fileName.replace(/\.json$/, '');
                return {
                    label: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
                    description: proj.fileName,
                    contextValue: 'projectNode',
                    tooltip: path.join('cypress', 'env', proj.fileName),
                };
            });
        }

        if (element.contextValue === 'projectNode') {
            const fileName = element.description!;
            const project = this.registry.find(p => p.fileName === fileName);
            if (!project) return [];

            const nodes: INodeItem[] = [];
            const data = project.data;

            if (data.POM_REGISTRY) {
                nodes.push({
                    label: NODE_LABELS['ui'],
                    children: this.buildChildrenFromRegistry(data.POM_REGISTRY),
                    contextValue: 'uiRootNode'
                });
            }

            if (data.SERVICE_REGISTRY) {
                const grouped: Record<string, any> = {};
                for (const [key, val] of Object.entries(data.SERVICE_REGISTRY)) {
                    const folder = path.dirname((val as any).path).split(path.sep).pop() || '';
                    if (!grouped[folder]) grouped[folder] = {};
                    grouped[folder][key] = val;
                }
                const children: INodeItem[] = [];
                for (const [folder, content] of Object.entries(grouped)) {
                    children.push({
                        label: NODE_LABELS[folder.toLowerCase()] || folder,
                        children: this.buildChildrenFromRegistry(content)
                    });
                }
                nodes.push({
                    label: NODE_LABELS['service'],
                    children,
                    contextValue: 'serviceRootNode'
                });
            }

            return nodes;
        }

        return element.children || [];
    }

    addChildNode(element: INodeItem, type: 'Menu' | 'Form' | 'Field' | 'Button') {
        vscode.window.showInputBox({ prompt: `Enter name for new ${type}` }).then(name => {
            if (!name) return;

            const parentPath = element.tooltip;
            if (!parentPath) {
                vscode.window.showErrorMessage("Parent node has no file path.");
                return;
            }

            const jsonPath = path.join(this.workspaceRoot, 'cypress', 'e2e', parentPath);
            if (!fs.existsSync(jsonPath)) {
                vscode.window.showErrorMessage("JSON file not found: " + jsonPath);
                return;
            }

            try {
                const content = fs.readFileSync(jsonPath, 'utf-8');
                const jsonContent = JSON.parse(content);

                if (type === 'Menu') {
                    if (!jsonContent.MENU) jsonContent.MENU = {};
                    jsonContent.MENU[name] = { "SELECTOR": { "cmd": "get", "args": [] }, "ITEMS": {} };
                } else if (type === 'Form') {
                    if (!jsonContent.FORM) jsonContent.FORM = {};
                    jsonContent.FORM[name] = { "FIELDS": {}, "BUTTONS": {} };
                } else if (type === 'Field') {
                    if (!jsonContent.FORM) {
                        vscode.window.showErrorMessage("Add a Form first before adding fields.");
                        return;
                    }
                    const formName = Object.keys(jsonContent.FORM)[0];
                    jsonContent.FORM[formName].FIELDS[name] = { "SELECTOR": { "cmd": "get", "args": [] }, "entry": ["INPUT"], "isOptional": false };
                } else if (type === 'Button') {
                    if (!jsonContent.FORM) {
                        vscode.window.showErrorMessage("Add a Form first before adding buttons.");
                        return;
                    }
                    const formName = Object.keys(jsonContent.FORM)[0];
                    jsonContent.FORM[formName].BUTTONS[name] = { "SELECTOR": { "cmd": "get", "args": [] }, "type": "SUBMIT" };
                } else if (type === 'Endpoint') {
                    if (!jsonContent.ENDPOINTS) jsonContent.ENDPOINTS = {};
                    jsonContent.ENDPOINTS[name] = { "method": "GET", "url": "" };
                }

                fs.writeFileSync(jsonPath, JSON.stringify(jsonContent, null, 2), 'utf-8');
                vscode.window.showInformationMessage(`${type} '${name}' added to ${jsonPath}`);
                this.refresh();
            } catch (err) {
                vscode.window.showErrorMessage("Failed to update JSON: " + err);
            }
        });
    }

    private buildChildrenFromRegistry(registry: Record<string, any>): INodeItem[] {
        return Object.entries(registry).map(([nodeName, val]) => {
            const node: INodeItem = { label: nodeName };

            if (val && typeof val === 'object' && 'path' in val) {
                const jsonPath = path.join(this.workspaceRoot, 'cypress', 'e2e', val.path);
                if (fs.existsSync(jsonPath)) {
                    try {
                        const content = fs.readFileSync(jsonPath, 'utf-8').trim();
                        if (content) {
                            const jsonContent = JSON.parse(content);
                            const childrenFromJson = this.flattenJson(jsonContent, undefined, val.path);
                            if (childrenFromJson.length > 0) {
                                node.children = childrenFromJson;
                            }
                        }

                        if ('type' in val && val.type) {
                            node.description = val.type;
                            node.contextValue = 'serviceNode';
                        } else {
                            node.description = 'Page';
                            node.contextValue = 'pageNode';
                        }

                        node.tooltip = val.path; // only for page/service
                    } catch {
                        node.description = 'Invalid JSON file';
                    }
                }
            }
            return node;
        });
    }

    private flattenJson(obj: any, parentKey?: string, parentPath?: string): INodeItem[] {
        if (typeof obj !== 'object' || obj === null) return [];

        return Object.entries(obj).map(([key, value]) => {
            let description: string | undefined;
            let contextValue: string | undefined;
            let tooltip: string | undefined;

            if (parentKey?.toLowerCase() === 'menu') {
                description = 'Menu';
                contextValue = 'menuNode';
            } else if (parentKey?.toLowerCase() === 'form') {
                description = 'Form';
                contextValue = 'formNode';
            } else if (parentKey?.toLowerCase() === 'buttons') {
                description = 'Button';
                contextValue = 'buttonNode';
            } else if (parentKey?.toLowerCase() === 'fields') {
                description = 'Field';
                contextValue = 'fieldNode';
            } else if (parentKey?.toLowerCase() === 'endpoints') {
                description = 'Endpoint';
                contextValue = 'endpointNode';
                // store parent json path in tooltip for endpoints
                tooltip = parentPath;
            } else if (key?.toLowerCase() === 'selector') {
                description = 'Cypress selector';
                contextValue = 'selectorNode';
            }

            if (typeof value === 'object' && value !== null) {
                const children = this.flattenJson(value, key, parentPath);
                return {
                    label: key,
                    description,
                    contextValue,
                    tooltip, // only set for endpoints
                    children: children.length > 0 ? children : undefined
                };
            } else {
                return {
                    label: key,
                    description: description || String(value),
                    contextValue,
                    tooltip
                };
            }
        });
    }
}
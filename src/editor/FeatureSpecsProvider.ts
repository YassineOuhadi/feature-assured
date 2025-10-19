import * as vscode from 'vscode';
import * as fs from 'fs';

export class FeatureSpecsProvider implements vscode.TreeDataProvider<SpecItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private specs: any) { }

  refresh(specs: any) {
    this.specs = specs;
    this._onDidChangeTreeData.fire();
  }

  public getAllSpecs() {
    const allSpecs: any[] = [];
    if (!this.specs) return allSpecs;

    for (const steps of Object.values(this.specs)) {
      if (Array.isArray(steps)) allSpecs.push(...steps);
    }
    return allSpecs;
  }

  getTreeItem(element: SpecItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SpecItem): Thenable<SpecItem[]> {
    if (!this.specs) return Promise.resolve([]);

    // normalize CLI JSON [{category, type, step, definition}, ...]
    const allSteps: any[] = [];
    for (const [rawCat, steps] of Object.entries(this.specs)) {
      if (Array.isArray(steps)) {
        const cleanCat = normalizeCategory(rawCat);
        allSteps.push(...steps.map(s => ({ ...s, rawCategory: rawCat, category: cleanCat })));
      }
    }

    if (!element) {
      // show categories (REST, GraphQL, Page, ...)
      const categories = Array.from(new Set(allSteps.map(s => s.category)));
      return Promise.resolve(
        categories.map(cat => new SpecItem(cat, vscode.TreeItemCollapsibleState.Collapsed, cat))
      );
    }

    // show steps for category
    const steps = allSteps.filter(s => s.category === element.rawCategory);
    return Promise.resolve(
      steps.map(step => {
        const item = new SpecItem(formatStepLabel(step), vscode.TreeItemCollapsibleState.None, step.category);
        item.iconPath = getStepIcon(step.type);
        item.tooltip = step.definition;

        const defPath = step.definition?.split(':')[0];
        if (defPath && fs.existsSync(defPath)) {
          item.command = {
            command: 'vscode.open',
            title: 'Open Step Definition',
            arguments: [vscode.Uri.file(defPath)],
          };
        }
        return item;
      })
    );
  }
}

// ----------------------
// Helpers
// ----------------------
function normalizeCategory(raw: string): string {
  if (raw.includes('rest')) return 'REST';
  if (raw.includes('graphql')) return 'GraphQL';
  if (raw.includes('soap')) return 'SOAP';
  if (raw.includes('websocket')) return 'WebSocket';
  if (raw.includes('page')) return 'Page';
  return raw;
}

function formatStepLabel(step: any): string {
  const type = step.type?.padEnd(6, ' ');
  return `${type} — ${step.step}`;
}

function getStepIcon(type: string): vscode.ThemeIcon {
  switch (type?.toLowerCase()) {
    case 'given':
      return new vscode.ThemeIcon('symbol-event');
    case 'when':
      return new vscode.ThemeIcon('play-circle');
    case 'then':
      return new vscode.ThemeIcon('check');
    default:
      return new vscode.ThemeIcon('circle-large-outline');
  }
}

export class SpecItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly rawCategory: string
  ) {
    super(label, collapsibleState);
    this.contextValue = rawCategory;
  }
}
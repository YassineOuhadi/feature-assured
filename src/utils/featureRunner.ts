import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export class FeatureRunner {
  private static output = vscode.window.createOutputChannel('Feature Assured Runner');
  private static running = new Set<string>();

  static isRunning(filePath: string): boolean {
    return this.running.has(filePath);
  }

  static async runFeature(filePath: string, workspaceRoot: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.output.clear();
      this.output.show(true);

      const relativePath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
      this.output.appendLine(`▶ Running feature: ${relativePath}\n`);

      const pkgPath = path.join(workspaceRoot, 'package.json');
      const hasScript =
        fs.existsSync(pkgPath) &&
        JSON.parse(fs.readFileSync(pkgPath, 'utf8')).scripts?.['cy:run'];

      const cmd = hasScript ? 'npm' : 'npx';
      const args = hasScript
        ? [
            'run',
            'cy:run',
            '--',
            '--spec',
            `'${relativePath}'`
          ]
        : [
            'cypress',
            'run',
            '--spec',
            `'${relativePath}'`
          ];

      const proc = spawn(cmd, args, { cwd: workspaceRoot, shell: true });

      this.running.add(filePath);

      proc.stdout.on('data', (data) => this.output.append(data.toString()));
      proc.stderr.on('data', (data) => this.output.append(data.toString()));

      proc.on('close', (code) => {
        this.running.delete(filePath);

        if (code === 0) {
          this.output.appendLine('\n✅ Feature run completed successfully.');
          resolve(true);
        } else {
          this.output.appendLine('\n❌ Feature run failed.');
          resolve(false);
        }
      });
    });
  }
}

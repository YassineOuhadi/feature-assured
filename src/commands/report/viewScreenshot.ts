import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

export async function viewScreenshotCommand(step: any) {
  if (!step?.data || !step?.mime_type) {
    vscode.window.showErrorMessage('No screenshot data found for this step.');
    return;
  }

  try {
    const buffer = Buffer.from(step.data, 'base64');

    const tempDir = path.join(tmpdir(), 'feature-assured-screenshots');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const fileName = `${step.name.replace(/\s+/g, '_')}.png`;
    const filePath = path.join(tempDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const imageUri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand('vscode.open', imageUri);
  } catch (err) {
    console.error(err);
    vscode.window.showErrorMessage('Failed to open screenshot.');
  }
}
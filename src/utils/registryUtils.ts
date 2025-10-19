import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { INodeItem } from '../types';

let registryFileTypeMap: Record<string, string> = {};

export function getRegistryFileTypeMap() {
  return registryFileTypeMap;
}

export function buildRegistryFileTypeMap(workspaceRoot: string) {
  registryFileTypeMap = {};
  const envDir = path.join(workspaceRoot, 'cypress', 'env');
  if (!fs.existsSync(envDir)) return;

  const files = fs.readdirSync(envDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(envDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (data.POM_REGISTRY) {
          for (const [key, val] of Object.entries(data.POM_REGISTRY)) {
            if (val && typeof val === 'object' && 'path' in val) {
              const relPath = (val as any).path;
              registryFileTypeMap[relPath] = 'page';
            }
          }
        }

        if (data.SERVICE_REGISTRY) {
          for (const [key, val] of Object.entries(data.SERVICE_REGISTRY)) {
            if (val && typeof val === 'object' && 'path' in val && 'type' in val) {
              const relPath = (val as any).path;
              const type = (val as any).type;
              registryFileTypeMap[relPath] = type;
            }
          }
        }
      } catch (e) {
        console.error(`Failed to parse ${file}:`, e);
      }
    }
  }
}

export function getRelativePathFromE2e(fullPath: string): string {
  const e2eIndex = fullPath.indexOf('cypress' + path.sep + 'e2e' + path.sep);
  if (e2eIndex === -1) return '';
  return fullPath.substring(e2eIndex + ('cypress' + path.sep + 'e2e' + path.sep).length);
}
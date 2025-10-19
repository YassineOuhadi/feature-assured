import * as vscode from 'vscode';
import * as Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

function loadSchema(type: string): any {
  const schemaPath = path.join(__dirname, '..', '..', 'resources', 'schemas', `${type}.schema.json`);
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema not found for type: ${type}`);
  }
  return JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
}

const ajv = new Ajv.default({ allErrors: true, verbose: true });

export async function validateJsonSchema(document: vscode.TextDocument, type: string): Promise<void> {
  try {
    const content = document.getText();
    const json = JSON.parse(content);

    const schema = loadSchema(type);
    const typeName = type.charAt(0).toUpperCase() + type.slice(1) + ' API';

    const validate = ajv.compile(schema);
    const valid = validate(json);

    if (valid) {
      vscode.window.showInformationMessage(`✔️ ${typeName} schema is valid`);
    } else {
      const errors = validate.errors?.map(e => 
        `${e.instancePath || '/'}: ${e.message}`
      ).join('\n');
      vscode.window.showErrorMessage(`❌ ${typeName} schema invalid:\n${errors}`);
    }
  } catch (e: any) {
    if (e instanceof SyntaxError) {
      vscode.window.showErrorMessage('Invalid JSON syntax');
    } else {
      vscode.window.showErrorMessage(`Validation error: ${e.message}`);
    }
  }
}
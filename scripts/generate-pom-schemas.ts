const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const WRAPPERS_DIR = path.resolve(__dirname, '..', '..', 'cypress', 'support', 'wrappers');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'src', 'schemas');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const wrappers = [
  { name: 'rest', file: 'service/IRestApiWrapper.ts', interface: 'IRestApiWrapper' },
  { name: 'graphql', file: 'service/IGraphQLWrapper.ts', interface: 'IGraphQLWrapper' },
  { name: 'soap', file: 'service/ISoapWrapper.ts', interface: 'ISoapWrapper' },
  { name: 'websocket', file: 'service/IWebSocketWrapper.ts', interface: 'IWebSocketWrapper' }
  //TODO: pom wrappers
  // { name: 'page', file: 'pom/IPageWrapper.ts', interface: 'IPageWrapper' }

];

wrappers.forEach(wrapper => {
  const fullPath = path.join(WRAPPERS_DIR, wrapper.file);
  const outputPath = path.join(OUTPUT_DIR, `${wrapper.name}.schema.json`);
  
  try {
    const cmd = `npx typescript-json-schema ${path.resolve(__dirname, '..', '..', 'tsconfig.json')} ${wrapper.interface} --required --noExtraProps --out ${outputPath} --path ${fullPath}`;
    execSync(cmd, { stdio: 'inherit' });
    
    const schema = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    function relax(obj) {
      if (obj && typeof obj === 'object') {
        if (obj.type === 'object') {
          obj.additionalProperties = true;
        }
        Object.values(obj).forEach(relax);
      }
    }
    relax(schema);
    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
    
    console.log(`Generated and relaxed ${wrapper.name} schema`);
  } catch (e) {
    console.error(`Failed to generate ${wrapper.name} schema:`, e.message);
  }
});
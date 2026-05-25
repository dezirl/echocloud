import JavaScriptObfuscator from 'javascript-obfuscator';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Obfuscation options — balanced: strong protection without breaking the app
const OPTIONS = {
  compact: true,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 0.8,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayIndexShift: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  unicodeEscapeSequence: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: true,
  // Skipping controlFlowFlattening and deadCodeInjection — too risky for React bundles
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  sourceMap: false,
};

function obfuscateFile(filePath) {
  const src = readFileSync(filePath, 'utf8');
  try {
    const result = JavaScriptObfuscator.obfuscate(src, OPTIONS);
    writeFileSync(filePath, result.getObfuscatedCode(), 'utf8');
    const before = Buffer.byteLength(src, 'utf8');
    const after = Buffer.byteLength(result.getObfuscatedCode(), 'utf8');
    console.log(`  ✓ ${filePath.split(/[/\\]/).slice(-2).join('/')} (${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB)`);
  } catch (err) {
    console.warn(`  ⚠ Skipped ${filePath}: ${err.message}`);
  }
}

function walkDir(dir, callback) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkDir(full, callback);
    } else if (extname(full) === '.js') {
      callback(full);
    }
  }
}

console.log('\n🔒 Obfuscating renderer (dist/assets)...');
walkDir('dist/assets', obfuscateFile);

console.log('\n🔒 Obfuscating Electron main & preload...');
obfuscateFile('dist-electron/main.cjs');
obfuscateFile('dist-electron/preload.cjs');

console.log('\n✅ Obfuscation complete.\n');

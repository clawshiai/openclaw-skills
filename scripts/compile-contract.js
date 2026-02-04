import solc from 'solc';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const contractPath = join(__dirname, '../contracts/ClawshiMarket.sol');
const source = readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'ClawshiMarket.sol': { content: source }
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object']
      }
    }
  }
};

console.log('Compiling ClawshiMarket.sol...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const errors = output.errors.filter(e => e.severity === 'error');
  if (errors.length > 0) {
    console.error('Compilation errors:');
    errors.forEach(e => console.error(e.formattedMessage));
    process.exit(1);
  }
  // Show warnings
  output.errors.filter(e => e.severity === 'warning').forEach(w => {
    console.warn('Warning:', w.message);
  });
}

const contract = output.contracts['ClawshiMarket.sol']['ClawshiMarket'];
const artifact = {
  abi: contract.abi,
  bytecode: '0x' + contract.evm.bytecode.object
};

const outPath = join(__dirname, '../contracts/ClawshiMarket.json');
writeFileSync(outPath, JSON.stringify(artifact, null, 2));
console.log(`Compiled successfully! ABI + bytecode saved to contracts/ClawshiMarket.json`);
console.log(`ABI has ${artifact.abi.length} entries`);
console.log(`Bytecode: ${artifact.bytecode.length} chars`);

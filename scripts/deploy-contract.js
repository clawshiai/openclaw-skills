import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base Sepolia config
const RPC_URL = 'https://sepolia.base.org';
const CHAIN_ID = 84532;
const USDC_ADDRESS = '0x036cbd53842c5426634e7929541ec2318f3dcf7e';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('Set PRIVATE_KEY environment variable');
  console.error('Usage: PRIVATE_KEY=0x... node scripts/deploy-contract.js');
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('Deployer:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('ETH balance:', ethers.formatEther(balance));

  if (balance === 0n) {
    console.error('No ETH for gas! Get testnet ETH from https://www.alchemy.com/faucets/base-sepolia');
    process.exit(1);
  }

  const artifact = JSON.parse(
    readFileSync(join(__dirname, '../contracts/ClawshiMarket.json'), 'utf8')
  );

  console.log('\nDeploying ClawshiMarket to Base Sepolia...');
  console.log('USDC address:', USDC_ADDRESS);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(USDC_ADDRESS);

  console.log('Tx hash:', contract.deploymentTransaction().hash);
  console.log('Waiting for confirmation...');

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('\n=== DEPLOYMENT SUCCESSFUL ===');
  console.log('Contract address:', address);
  console.log('Chain: Base Sepolia (84532)');
  console.log('USDC:', USDC_ADDRESS);
  console.log('Owner:', wallet.address);
  console.log(`\nVerify: https://sepolia.basescan.org/address/${address}`);
  console.log(`\nSave this address! Add it to your .env as CONTRACT_ADDRESS=${address}`);
}

main().catch(err => {
  console.error('Deployment failed:', err.message);
  process.exit(1);
});

/**
 * Hardhat deploy script for BlessingPool and AgentRegistry
 * 
 * Kullanım:
 *   npx hardhat run contracts/deploy-blessing.ts --network arcTestnet
 * 
 * Gereksinimler:
 *   - hardhat.config.ts'te arcTestnet network tanımı
 *   - .env'de DEPLOYER_PRIVATE_KEY
 *   - Arc Testnet'te USDC kontrat adresi
 * 
 * NOT: Bu script Hardhat ortamında çalıştırılmalıdır.
 *      Abacus AI Agent ortamında Hardhat çalıştırılamaz.
 */

/*
import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  // Arc Testnet USDC adresi (.env'den alınmalı)
  const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!;
  const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS!;

  // BlessingPool deploy
  const BlessingPool = await ethers.getContractFactory('BlessingPool');
  const bp = await BlessingPool.deploy(USDC_ADDRESS, RELAYER_ADDRESS);
  await bp.waitForDeployment();
  console.log('BlessingPool:', await bp.getAddress());

  // AgentRegistry deploy
  const AgentRegistry = await ethers.getContractFactory('AgentRegistry');
  const ar = await AgentRegistry.deploy();
  await ar.waitForDeployment();
  console.log('AgentRegistry:', await ar.getAddress());

  console.log('\n--- .env.local güncellemesi ---');
  console.log(`NEXT_PUBLIC_BLESSING_POOL_ADDRESS=${await bp.getAddress()}`);
  console.log(`NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=${await ar.getAddress()}`);
}

main().catch(console.error);
*/

console.log('Bu deploy script Hardhat ortamında çalıştırılmalıdır.');
console.log('npx hardhat run contracts/deploy-blessing.ts --network arcTestnet');

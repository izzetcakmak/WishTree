import { ethers } from 'ethers';
import { ARC_TESTNET } from './contract';
import {
  ERC8004_CONTRACTS,
  IDENTITY_REGISTRY_ABI,
  REPUTATION_REGISTRY_ABI,
  VALIDATION_REGISTRY_ABI,
} from './erc8004';
import { getProvider } from './blockchain';

// --- Identity Registry ---

/** Client-side register via MetaMask (legacy — kept for reference) */
export async function registerAgent(metadataURI: string): Promise<ethers.ContractTransaction> {
  const provider = await getProvider();
  if (!provider) throw new Error('No provider');
  const signer = provider.getSigner();
  const contract = new ethers.Contract(
    ERC8004_CONTRACTS.IDENTITY_REGISTRY,
    IDENTITY_REGISTRY_ABI,
    signer
  );
  const tx = await contract.register(metadataURI);
  return tx;
}

/**
 * Raw fetch-based RPC helper (avoids ethers JsonRpcProvider network detection issues in prod).
 */
async function rpcFetch(method: string, params: any[]): Promise<any> {
  const res = await fetch(ARC_TESTNET.rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message || JSON.stringify(json.error)}`);
  return json.result;
}

/**
 * Server-side agent registration using relayer private key.
 * Uses raw fetch calls to avoid ethers provider NETWORK_ERROR in production.
 */
export async function registerAgentOnChain(metadataURI: string): Promise<{ txHash: string; agentTokenId: number }> {
  const relayerKey = process.env.RELAYER_PRIVATE_KEY;
  if (!relayerKey) throw new Error('RELAYER_PRIVATE_KEY not configured');

  const wallet = new ethers.Wallet(relayerKey);
  const iface = new ethers.utils.Interface(IDENTITY_REGISTRY_ABI as any);
  const calldata = iface.encodeFunctionData('register', [metadataURI]);

  console.log(`[ERC-8004] Registering agent on-chain via relayer ${wallet.address}...`);

  // Get nonce and gas price via raw fetch
  const [nonceHex, gasPriceHex, chainIdHex] = await Promise.all([
    rpcFetch('eth_getTransactionCount', [wallet.address, 'latest']),
    rpcFetch('eth_gasPrice', []),
    rpcFetch('eth_chainId', []),
  ]);

  const nonce = parseInt(nonceHex, 16);
  const chainId = parseInt(chainIdHex, 16);

  // Estimate gas
  let gasLimit = 300000;
  try {
    const estHex = await rpcFetch('eth_estimateGas', [{
      from: wallet.address,
      to: ERC8004_CONTRACTS.IDENTITY_REGISTRY,
      data: calldata,
    }]);
    gasLimit = Math.ceil(parseInt(estHex, 16) * 1.3); // 30% buffer
  } catch {
    console.log('[ERC-8004] Gas estimation failed, using default 300000');
  }

  // Build and sign transaction
  const tx = {
    to: ERC8004_CONTRACTS.IDENTITY_REGISTRY,
    data: calldata,
    nonce,
    gasLimit: ethers.utils.hexlify(gasLimit),
    gasPrice: gasPriceHex,
    chainId,
  };

  const signedTx = await wallet.signTransaction(tx);

  // Send raw transaction
  const txHash = await rpcFetch('eth_sendRawTransaction', [signedTx]);
  console.log(`[ERC-8004] TX sent: ${txHash}`);

  // Poll for receipt (max ~60s)
  let receipt: any = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    receipt = await rpcFetch('eth_getTransactionReceipt', [txHash]);
    if (receipt) break;
  }

  if (!receipt) throw new Error(`TX ${txHash} not confirmed after 60s`);
  if (receipt.status === '0x0') throw new Error(`TX ${txHash} reverted`);

  console.log(`[ERC-8004] TX confirmed: ${txHash}`);

  // Parse Transfer event to get tokenId
  let agentTokenId: number | null = null;
  const transferTopic = ethers.utils.id('Transfer(address,address,uint256)');
  for (const log of (receipt.logs || [])) {
    if (log.address?.toLowerCase() !== ERC8004_CONTRACTS.IDENTITY_REGISTRY.toLowerCase()) continue;
    if (log.topics?.[0] === transferTopic) {
      // tokenId is the 3rd topic (topics[3]) for ERC721 Transfer
      const tokenIdHex = log.topics[3];
      if (tokenIdHex) {
        agentTokenId = parseInt(tokenIdHex, 16);
        break;
      }
    }
  }

  if (agentTokenId === null) {
    throw new Error('Agent registered but could not parse tokenId from receipt');
  }

  console.log(`[ERC-8004] Agent registered with tokenId: ${agentTokenId}`);
  return { txHash, agentTokenId };
}

export async function getAgentOwner(agentId: number): Promise<string | null> {
  try {
    const result = await directRpcCall(
      ERC8004_CONTRACTS.IDENTITY_REGISTRY,
      'ownerOf',
      IDENTITY_REGISTRY_ABI,
      [agentId]
    );
    return result?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getAgentTokenURI(agentId: number): Promise<string | null> {
  try {
    const result = await directRpcCall(
      ERC8004_CONTRACTS.IDENTITY_REGISTRY,
      'tokenURI',
      IDENTITY_REGISTRY_ABI,
      [agentId]
    );
    return result?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getAgentIdFromTx(txHash: string): Promise<number | null> {
  try {
    const res = await fetch(ARC_TESTNET.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      }),
    });
    const json = await res.json();
    const receipt = json?.result;
    if (!receipt?.logs) return null;

    const iface = new ethers.utils.Interface(IDENTITY_REGISTRY_ABI as any);
    for (const log of receipt.logs) {
      try {
        if (log.address?.toLowerCase() !== ERC8004_CONTRACTS.IDENTITY_REGISTRY.toLowerCase()) continue;
        const parsed = iface.parseLog(log);
        if (parsed.name === 'Transfer') {
          const tokenId = parsed.args.tokenId;
          return typeof tokenId?.toNumber === 'function' ? tokenId.toNumber() : Number(tokenId);
        }
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// --- Reputation Registry ---

export async function giveFeedback(
  agentId: number,
  score: number,
  tag: string,
  comment: string = ''
): Promise<ethers.ContractTransaction> {
  const provider = await getProvider();
  if (!provider) throw new Error('MetaMask bulunamadı.');
  const signer = provider.getSigner();
  const contract = new ethers.Contract(
    ERC8004_CONTRACTS.REPUTATION_REGISTRY,
    REPUTATION_REGISTRY_ABI,
    signer
  );
  const feedbackHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tag));
  try {
    const tx = await contract.giveFeedback(
      agentId,
      score.toString(),
      '0', // category
      tag,
      comment,
      '', // metadata
      '', // uri
      feedbackHash
    );
    return tx;
  } catch (err: any) {
    if (err?.code === 'ACTION_REJECTED' || err?.code === 4001) {
      throw new Error('İşlem reddedildi.');
    }
    if (err?.code === 'UNPREDICTABLE_GAS_LIMIT') {
      throw new Error('İşlem başarısız olabilir. Kontrat fonksiyon parametreleri uyumsuz olabilir.');
    }
    throw err;
  }
}

// --- Validation Registry ---

export async function requestValidation(
  validatorAddress: string,
  agentId: number,
  requestURI: string
): Promise<{ tx: ethers.ContractTransaction; requestHash: string }> {
  const provider = await getProvider();
  if (!provider) throw new Error('MetaMask bulunamadı.');
  const signer = provider.getSigner();
  const contract = new ethers.Contract(
    ERC8004_CONTRACTS.VALIDATION_REGISTRY,
    VALIDATION_REGISTRY_ABI,
    signer
  );
  const requestHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(`validation_request_agent_${agentId}_${Date.now()}`)
  );
  try {
    const tx = await contract.validationRequest(validatorAddress, agentId, requestURI, requestHash);
    return { tx, requestHash };
  } catch (err: any) {
    if (err?.code === 'ACTION_REJECTED' || err?.code === 4001) {
      throw new Error('İşlem reddedildi.');
    }
    if (err?.code === 'UNPREDICTABLE_GAS_LIMIT') {
      throw new Error('İşlem başarısız olabilir. Geçersiz doğrulayıcı adresi veya kontrat hatası.');
    }
    throw err;
  }
}

export async function respondToValidation(
  requestHash: string,
  response: number,
  tag: string = 'verified'
): Promise<ethers.ContractTransaction> {
  const provider = await getProvider();
  if (!provider) throw new Error('No provider');
  const signer = provider.getSigner();
  const contract = new ethers.Contract(
    ERC8004_CONTRACTS.VALIDATION_REGISTRY,
    VALIDATION_REGISTRY_ABI,
    signer
  );
  const tx = await contract.validationResponse(
    requestHash,
    response.toString(),
    '',
    '0x' + '0'.repeat(64),
    tag
  );
  return tx;
}

export async function getValidationStatus(requestHash: string): Promise<{
  validator: string;
  agentId: number;
  response: number;
  tag: string;
} | null> {
  try {
    const result = await directRpcCall(
      ERC8004_CONTRACTS.VALIDATION_REGISTRY,
      'getValidationStatus',
      VALIDATION_REGISTRY_ABI,
      [requestHash]
    );
    if (!result) return null;
    return {
      validator: result[0],
      agentId: typeof result[1]?.toNumber === 'function' ? result[1].toNumber() : Number(result[1]),
      response: typeof result[2]?.toNumber === 'function' ? result[2].toNumber() : Number(result[2]),
      tag: result[4] || '',
    };
  } catch {
    return null;
  }
}

// --- Helper: Direct RPC Call ---

async function directRpcCall(
  contractAddress: string,
  functionName: string,
  abi: any,
  params: any[]
): Promise<any> {
  try {
    const iface = new ethers.utils.Interface(abi);
    const calldata = iface.encodeFunctionData(functionName, params);
    const res = await fetch(ARC_TESTNET.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: contractAddress, data: calldata }, 'latest'],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.result || json.result === '0x') return null;
    return iface.decodeFunctionResult(functionName, json.result);
  } catch {
    return null;
  }
}

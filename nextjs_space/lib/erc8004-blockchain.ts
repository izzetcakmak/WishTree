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
  if (!provider) throw new Error('No provider');
  const signer = provider.getSigner();
  const contract = new ethers.Contract(
    ERC8004_CONTRACTS.REPUTATION_REGISTRY,
    REPUTATION_REGISTRY_ABI,
    signer
  );
  const feedbackHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tag));
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
}

// --- Validation Registry ---

export async function requestValidation(
  validatorAddress: string,
  agentId: number,
  requestURI: string
): Promise<{ tx: ethers.ContractTransaction; requestHash: string }> {
  const provider = await getProvider();
  if (!provider) throw new Error('No provider');
  const signer = provider.getSigner();
  const contract = new ethers.Contract(
    ERC8004_CONTRACTS.VALIDATION_REGISTRY,
    VALIDATION_REGISTRY_ABI,
    signer
  );
  const requestHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(`validation_request_agent_${agentId}_${Date.now()}`)
  );
  const tx = await contract.validationRequest(validatorAddress, agentId, requestURI, requestHash);
  return { tx, requestHash };
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

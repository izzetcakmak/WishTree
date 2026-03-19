import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, ARC_TESTNET, WISH_COST } from './contract';

export async function getProvider(): Promise<ethers.providers.Web3Provider | null> {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  if (!win?.ethereum) return null;
  return new ethers.providers.Web3Provider(win.ethereum);
}

export async function connectWallet(): Promise<string | null> {
  try {
    const provider = await getProvider();
    if (!provider) throw new Error('MetaMask not found');
    const accounts = await provider.send('eth_requestAccounts', []);
    return accounts?.[0] ?? null;
  } catch (err: any) {
    console.error('Connect wallet error:', err);
    throw err;
  }
}

export async function switchToArcTestnet(): Promise<boolean> {
  try {
    const win = window as any;
    if (!win?.ethereum) return false;
    try {
      await win.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARC_TESTNET.chainIdHex }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
        await win.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: ARC_TESTNET.chainIdHex,
            chainName: ARC_TESTNET.name,
            nativeCurrency: ARC_TESTNET.currency,
            rpcUrls: [ARC_TESTNET.rpcUrl],
          }],
        });
        return true;
      }
      throw switchError;
    }
  } catch (err: any) {
    console.error('Switch network error:', err);
    return false;
  }
}

export async function checkNetwork(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    if (!win?.ethereum) return false;
    // Use ethereum.request directly instead of provider.getNetwork()
    // to avoid stale cached chain ID issues with ethers.js v5
    const chainIdHex = await win.ethereum.request({ method: 'eth_chainId' });
    if (!chainIdHex) return false;
    const chainId = parseInt(chainIdHex, 16);
    return chainId === ARC_TESTNET.chainId;
  } catch {
    return false;
  }
}

export function getContract(signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}

export async function makeAWish(wish: string): Promise<ethers.ContractTransaction> {
  const provider = await getProvider();
  if (!provider) throw new Error('No provider');
  const signer = provider.getSigner();
  const contract = getContract(signer);
  const tx = await contract.makeAWish(wish, { value: ethers.utils.parseEther(WISH_COST) });
  return tx;
}

async function directRpcCall(method: string, params: any[]): Promise<any> {
  try {
    const res = await fetch(ARC_TESTNET.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!res?.ok) return null;
    const json = await res?.json?.();
    return json?.result ?? null;
  } catch {
    return null;
  }
}

export async function getAllWishes(): Promise<string[]> {
  try {
    const iface = new ethers.utils.Interface(CONTRACT_ABI as any);
    const calldata = iface.encodeFunctionData('getAllWishes');
    const result = await directRpcCall('eth_call', [{ to: CONTRACT_ADDRESS, data: calldata }, 'latest']);
    if (!result) return [];
    const decoded = iface.decodeFunctionResult('getAllWishes', result);
    const wishes = decoded?.[0];
    return Array.isArray(wishes) ? wishes.map((w: any) => String(w ?? '')) : [];
  } catch {
    return [];
  }
}

export async function getTotalSupply(): Promise<number> {
  try {
    const iface = new ethers.utils.Interface(CONTRACT_ABI as any);
    const calldata = iface.encodeFunctionData('totalSupply');
    const result = await directRpcCall('eth_call', [{ to: CONTRACT_ADDRESS, data: calldata }, 'latest']);
    if (!result) return 0;
    const decoded = iface.decodeFunctionResult('totalSupply', result);
    const supply = decoded?.[0];
    try {
      return supply?.toNumber?.() ?? 0;
    } catch {
      const str = supply?.toString?.() ?? '0';
      const num = parseInt(str, 10);
      return isNaN(num) ? 0 : Math.min(num, Number.MAX_SAFE_INTEGER);
    }
  } catch {
    return 0;
  }
}

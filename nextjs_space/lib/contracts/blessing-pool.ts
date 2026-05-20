/**
 * BlessingPool.sol ABI ve adres yapılandırması
 * Deploy edildikten sonra NEXT_PUBLIC_BLESSING_POOL_ADDRESS env var'ı ayarlanmalıdır.
 */

export const BLESSING_POOL_ADDRESS = process.env.NEXT_PUBLIC_BLESSING_POOL_ADDRESS || '';

export const BLESSING_POOL_ABI = [
  {
    inputs: [{ internalType: 'address', name: '_usdc', type: 'address' }, { internalType: 'address', name: '_relayer', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  // Events
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }, { indexed: true, internalType: 'address', name: 'owner', type: 'address' }], name: 'WishRegistered', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }, { indexed: true, internalType: 'address', name: 'blesser', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }, { indexed: false, internalType: 'string', name: 'message', type: 'string' }, { indexed: false, internalType: 'bytes32', name: 'agentId', type: 'bytes32' }], name: 'Blessed', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }, { indexed: true, internalType: 'address', name: 'owner', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'Claimed', type: 'event' },
  // Read
  { inputs: [{ internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }], name: 'wishOwners', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }], name: 'totalBlessed', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }], name: 'totalClaimed', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }], name: 'getBlessingCount', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }], name: 'claimable', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'usdc', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'relayer', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  // Write
  { inputs: [{ internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }, { internalType: 'address', name: 'wishOwner', type: 'address' }], name: 'registerWish', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }, { internalType: 'string', name: 'message', type: 'string' }, { internalType: 'bytes32', name: 'agentId', type: 'bytes32' }], name: 'bless', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }], name: 'claimBlessings', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'wishTokenId', type: 'uint256' }], name: 'claimForOwner', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: '_relayer', type: 'address' }], name: 'setRelayer', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const;

// USDC ERC-20 ABI (approve + allowance + balanceOf)
export const USDC_ABI = [
  { inputs: [{ internalType: 'address', name: 'spender', type: 'address' }, { internalType: 'uint256', name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'owner', type: 'address' }, { internalType: 'address', name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
] as const;

// USDC kontrat adresi (Arc Testnet)
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '';

/**
 * AgentRegistry.sol ABI ve adres yapılandırması
 * Deploy edildikten sonra NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS env var'ı ayarlanmalıdır.
 */

export const AGENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '';

export const AGENT_REGISTRY_ABI = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  // Events
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'agentId', type: 'uint256' }, { indexed: true, internalType: 'address', name: 'wallet', type: 'address' }, { indexed: false, internalType: 'string', name: 'name', type: 'string' }], name: 'AgentRegistered', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'agentId', type: 'uint256' }], name: 'AgentDeactivated', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint256', name: 'agentId', type: 'uint256' }], name: 'AgentReactivated', type: 'event' },
  // Read
  { inputs: [{ internalType: 'uint256', name: 'agentId', type: 'uint256' }], name: 'getAgent', outputs: [{ components: [{ internalType: 'address', name: 'walletAddress', type: 'address' }, { internalType: 'string', name: 'name', type: 'string' }, { internalType: 'string', name: 'criteria', type: 'string' }, { internalType: 'bool', name: 'active', type: 'bool' }, { internalType: 'uint256', name: 'createdAt', type: 'uint256' }], internalType: 'struct AgentRegistry.AgentInfo', name: '', type: 'tuple' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'agentId', type: 'uint256' }], name: 'isActive', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'nextAgentId', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'walletToAgent', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  // Write
  { inputs: [{ internalType: 'address', name: 'walletAddress', type: 'address' }, { internalType: 'string', name: 'name', type: 'string' }, { internalType: 'string', name: 'criteria', type: 'string' }], name: 'registerAgent', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'agentId', type: 'uint256' }], name: 'deactivateAgent', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: 'agentId', type: 'uint256' }], name: 'reactivateAgent', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const;

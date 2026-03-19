// ERC-8004 AI Agent Identity Standard - Contract Addresses & ABIs on Arc Testnet

export const ERC8004_CONTRACTS = {
  IDENTITY_REGISTRY: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  REPUTATION_REGISTRY: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
  VALIDATION_REGISTRY: '0x8004Cb1BF31DAf7788923b405b754f57acEB4272',
} as const;

export const IDENTITY_REGISTRY_ABI = [
  {
    inputs: [{ internalType: 'string', name: 'metadataURI', type: 'string' }],
    name: 'register',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
] as const;

export const REPUTATION_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'agentId', type: 'uint256' },
      { internalType: 'int128', name: 'score', type: 'int128' },
      { internalType: 'uint8', name: 'category', type: 'uint8' },
      { internalType: 'string', name: 'tag', type: 'string' },
      { internalType: 'string', name: 'comment', type: 'string' },
      { internalType: 'string', name: 'metadata', type: 'string' },
      { internalType: 'string', name: 'uri', type: 'string' },
      { internalType: 'bytes32', name: 'feedbackHash', type: 'bytes32' },
    ],
    name: 'giveFeedback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'agentId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'validator', type: 'address' },
      { indexed: false, internalType: 'int128', name: 'score', type: 'int128' },
      { indexed: false, internalType: 'string', name: 'tag', type: 'string' },
    ],
    name: 'FeedbackGiven',
    type: 'event',
  },
] as const;

export const VALIDATION_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'validator', type: 'address' },
      { internalType: 'uint256', name: 'agentId', type: 'uint256' },
      { internalType: 'string', name: 'requestURI', type: 'string' },
      { internalType: 'bytes32', name: 'requestHash', type: 'bytes32' },
    ],
    name: 'validationRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'requestHash', type: 'bytes32' },
      { internalType: 'uint8', name: 'response', type: 'uint8' },
      { internalType: 'string', name: 'responseURI', type: 'string' },
      { internalType: 'bytes32', name: 'responseHash', type: 'bytes32' },
      { internalType: 'string', name: 'tag', type: 'string' },
    ],
    name: 'validationResponse',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'requestHash', type: 'bytes32' }],
    name: 'getValidationStatus',
    outputs: [
      { internalType: 'address', name: 'validatorAddress', type: 'address' },
      { internalType: 'uint256', name: 'agentId', type: 'uint256' },
      { internalType: 'uint8', name: 'response', type: 'uint8' },
      { internalType: 'bytes32', name: 'responseHash', type: 'bytes32' },
      { internalType: 'string', name: 'tag', type: 'string' },
      { internalType: 'uint256', name: 'lastUpdate', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const AGENT_CATEGORIES = [
  { value: 'trading', label: 'Trading Agent', icon: '📈' },
  { value: 'defi', label: 'DeFi Agent', icon: '🏦' },
  { value: 'nft', label: 'NFT Agent', icon: '🎨' },
  { value: 'social', label: 'Social Agent', icon: '💬' },
  { value: 'analytics', label: 'Analytics Agent', icon: '📊' },
  { value: 'gaming', label: 'Gaming Agent', icon: '🎮' },
  { value: 'utility', label: 'Utility Agent', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '🤖' },
] as const;

// Contract addresses on Base Mainnet
export const CONTRACTS = {
  CLAWSHI_MARKET: '0xB19Fc7340a0Ce2F34eCF3F1Cacb63250cD14B945' as const,
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
};

// MarketFactory (vanity address - the one that works)
export const MARKET_FACTORY_ADDRESS = '0xc0DeBCEa2F1BcB268b01777ff9c8E3BB4dA85559' as `0x${string}`;
export const CHAINLINK_RESOLVER_ADDRESS = '0xDEbe4E62bEE1DA1657008480e6d91a3f1E3CCaeC' as `0x${string}`;
export const MANUAL_RESOLVER_ADDRESS = '0x3602D8989920B9A9451BF9D9562Bb97BA7cEd1bb' as `0x${string}`;

export const CHAIN_ID = 8453; // Base Mainnet

// USDC decimals
export const USDC_DECIMALS = 6;
export const MIN_STAKE = 100000n; // 0.1 USDC

// Format USDC for display
export function formatUSDC(amount: bigint): string {
  return (Number(amount) / 1e6).toFixed(2);
}

// Parse USDC from string input
export function parseUSDC(input: string): bigint {
  const parsed = parseFloat(input);
  if (isNaN(parsed) || parsed < 0) return 0n;
  return BigInt(Math.floor(parsed * 1e6));
}

// ClawshiMarket ABI (essential functions only)
export const clawshiMarketAbi = [
  {
    inputs: [
      { name: '_marketIndex', type: 'uint256' },
      { name: '_isYes', type: 'bool' },
      { name: '_amount', type: 'uint256' },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_marketIndex', type: 'uint256' }],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_marketIndex', type: 'uint256' },
      { name: '_user', type: 'address' },
    ],
    name: 'getStake',
    outputs: [
      { name: 'yesAmount', type: 'uint256' },
      { name: 'noAmount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_marketIndex', type: 'uint256' }],
    name: 'getMarket',
    outputs: [
      { name: 'clawshiId', type: 'uint256' },
      { name: 'question', type: 'string' },
      { name: 'deadline', type: 'uint256' },
      { name: 'yesPool', type: 'uint256' },
      { name: 'noPool', type: 'uint256' },
      { name: 'resolved', type: 'bool' },
      { name: 'outcome', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'marketCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'address' },
    ],
    name: 'claimed',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'marketIndex', type: 'uint256' },
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'isYes', type: 'bool' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'Staked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'marketIndex', type: 'uint256' },
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'payout', type: 'uint256' },
    ],
    name: 'Claimed',
    type: 'event',
  },
] as const;

// MarketFactory ABI (for on-chain markets)
export const marketFactoryAbi = [
  {
    inputs: [],
    name: 'getMarketCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'getMarket',
    outputs: [
      {
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'question', type: 'string' },
          { name: 'creator', type: 'address' },
          { name: 'resolver', type: 'address' },
          { name: 'resolverData', type: 'bytes' },
          { name: 'deadline', type: 'uint256' },
          { name: 'yesPool', type: 'uint256' },
          { name: 'noPool', type: 'uint256' },
          { name: 'creatorFee', type: 'uint256' },
          { name: 'resolved', type: 'bool' },
          { name: 'outcome', type: 'bool' },
          { name: 'paused', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'resolver', type: 'address' },
      { name: 'resolverData', type: 'bytes' },
      { name: 'deadline', type: 'uint256' },
      { name: 'creatorFeeBps', type: 'uint256' },
    ],
    name: 'createMarket',
    outputs: [{ name: 'marketId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'isYes', type: 'bool' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'resolveMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    name: 'stakes',
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'isYes', type: 'bool' },
      { name: 'claimed', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC20 ABI for USDC (essential functions)
export const erc20Abi = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

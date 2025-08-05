import { Token, ChainId } from "@uniswap/sdk";

// Universal Router and Permit2 Addresses
export const UNIVERSAL_ROUTER_ADDRESS =
  "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af";
export const ROUTER_ADDRESS_V2 = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

// Quoter Contract Address for Uniswap V4
// export const QUOTER_CONTRACT_ADDRESS =
//   "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // V3 Quoter

// export const POOL_FACTORY_CONTRACT_ADDRESS =
//   "0x1F98431c8aD98523631AE4a59f267346ea31F984";// v3
export const POOL_FACTORY_CONTRACT_ADDRESS =
  "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; //v2
export const QUOTER_CONTRACT_ADDRESS =
  "0x52f0e24d1c21c8a0cb1e5a5dd6198556bd9e1203";

// Contract ABIs
export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const PERMIT2_ABI = [
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const ROUTER_ABI = [
  {
    inputs: [
      { name: "commands", type: "bytes" },
      { name: "inputs", type: "bytes[]" },
      { name: "deadline", type: "uint256" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export const ROUTER_ABI_V2 = [
  {
    name: "swapExactETHForTokens",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
  },
] as const;

export const QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "Currency", name: "currency0", type: "address" },
              { internalType: "Currency", name: "currency1", type: "address" },
              { internalType: "uint24", name: "fee", type: "uint24" },
              { internalType: "int24", name: "tickSpacing", type: "int24" },
              {
                internalType: "contract IHooks",
                name: "hooks",
                type: "address",
              },
            ],
            internalType: "struct PoolKey",
            name: "poolKey",
            type: "tuple",
          },
          { internalType: "bool", name: "zeroForOne", type: "bool" },
          { internalType: "uint128", name: "exactAmount", type: "uint128" },
          { internalType: "bytes", name: "hookData", type: "bytes" },
        ],
        internalType: "struct IV4Quoter.QuoteExactSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const WETH_TOKEN = new Token(
  ChainId.MAINNET,
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  18,
  "WETH",
  "Wrapped Ether"
);
export const ETH_TOKEN = new Token(
  ChainId.MAINNET,
  "0xd76b5c2a23ef78368d8e34288b5b65d616b746ae",
  18,
  "ETH",
  "Ethereum"
);

export const USDC_TOKEN = new Token(
  ChainId.MAINNET,
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  6,
  "USDC",
  "USD//C"
);

export const SKYOPS_TOKEN = new Token(
  ChainId.MAINNET,
  "0x42168A285252BD00E4930e2F9dC01D496b14c90A",
  18,
  "SKYOPS",
  "Skyops"
);

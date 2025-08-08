import { useAppKitAccount } from "@reown/appkit/react";
import { ethers } from "ethers";
import { createPublicClient, http, parseUnits } from "viem";
import {
  LidoSDK,
  LidoSDKCore,
  SDKError,
  TransactionCallbackStage,
  LIDO_CONTRACT_NAMES,
} from "@lidofinance/lido-ethereum-sdk";
import { mainnet } from "viem/chains";
import { useCopilotAction } from "@copilotkit/react-core";

export interface EthereumProvider {
  request(...args: unknown[]): Promise<unknown>;
}

// const rpcProvider = createPublicClient({
//   chain: mainnet,
//   transport: http(
//     "https://wiser-billowing-diagram.quiknode.pro/7b5999ec873d704e376e88b7464a49ff0924414c/"
//   ),
//   batch: {
//     multicall: true,
//   },
// });

const sdk = new LidoSDK({
  chainId: 1,
  rpcUrls: [
    "https://wiser-billowing-diagram.quiknode.pro/7b5999ec873d704e376e88b7464a49ff0924414c/",
  ],
  web3Provider: LidoSDKCore.createWeb3Provider(
    1,
    window.ethereum as unknown as EthereumProvider
  ),
});

const Lido = () => {
  const { address, isConnected } = useAppKitAccount();

  // Helper function to create transaction callback
  const createCallback =
    (actionName: string) =>
    ({
      stage,
      payload,
    }: {
      stage: TransactionCallbackStage;
      payload?: unknown;
    }) => {
      switch (stage) {
        case TransactionCallbackStage.SIGN:
          console.log(`${actionName}: Waiting for signature...`);
          break;
        case TransactionCallbackStage.RECEIPT:
          console.log(`${actionName}: Waiting for receipt...`, payload);
          break;
        case TransactionCallbackStage.CONFIRMATION:
          console.log(`${actionName}: Waiting for confirmation...`, payload);
          break;
        case TransactionCallbackStage.DONE:
          console.log(`${actionName}: Transaction completed!`, payload);
          break;
        case TransactionCallbackStage.ERROR:
          console.log(`${actionName}: Transaction failed!`, payload);
          break;
        default:
          break;
      }
    };

  // Contract Addresses Actions
  useCopilotAction({
    name: "getLidoContractAddress",
    description:
      "Get contract addresses for various Lido protocol contracts including stETH, wstETH, withdrawal queue, and more.",
    parameters: [
      {
        name: "contractType",
        type: "string",
        description:
          "Type of contract address to retrieve. Options: 'lido' (stETH), 'wsteth', 'withdrawalQueue'",
        required: true,
      },
    ],
    handler: async ({ contractType }: { contractType: string }) => {
      try {
        let contractName: LIDO_CONTRACT_NAMES;
        let description: string;

        switch (contractType.toLowerCase()) {
          case "lido":
          case "steth":
            contractName = LIDO_CONTRACT_NAMES.lido;
            description = "Lido (stETH) main contract";
            break;
          case "wsteth":
            contractName = LIDO_CONTRACT_NAMES.wsteth;
            description = "Wrapped stETH (wstETH) contract";
            break;
          case "withdrawalqueue":
          case "withdrawal":
            contractName = LIDO_CONTRACT_NAMES.withdrawalQueue;
            description = "Withdrawal Queue contract";
            break;
          default:
            return `❌ Unknown contract type: ${contractType}. Available types: lido, wsteth, withdrawalQueue`;
        }

        const contractAddress = await sdk.core.getContractAddress(contractName);

        return `📍 ${description}:
Contract Address: ${contractAddress}
Contract Name: ${contractName}
Network: Ethereum Mainnet

💡 You can use this address to interact with the contract directly or through other tools.`;
      } catch (error) {
        console.error("Error fetching contract address:", error);
        return `❌ Error fetching contract address: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
      }
    },
  });

  // Balance Actions
  useCopilotAction({
    name: "getLidoBalances",
    description:
      "Get various balance information from Lido including ETH, stETH, wstETH, and shares balances for the connected wallet.",
    parameters: [
      {
        name: "balanceType",
        type: "string",
        description:
          "Type of balance to retrieve. Options: 'eth', 'steth', 'wsteth', 'shares', 'all'",
        required: true,
      },
      {
        name: "walletAddress",
        type: "string",
        description:
          "Wallet address to check balances for (optional, defaults to connected wallet)",
        required: false,
      },
    ],
    handler: async ({
      balanceType,
      walletAddress,
    }: {
      balanceType: string;
      walletAddress?: string;
    }) => {
      if (!isConnected && !walletAddress) {
        return "❌ Wallet not connected. Please connect your wallet or provide a wallet address.";
      }

      const targetAddress = (walletAddress || address) as `0x${string}`;

      try {
        let result = `💼 Lido Balance Information for ${targetAddress}:\n`;
        result += `${"=".repeat(60)}\n`;

        switch (balanceType.toLowerCase()) {
          case "eth":
            const ethBalance = await sdk.core.balanceETH(targetAddress);
            const ethFormatted = ethers.utils.formatEther(
              ethBalance.toString()
            );
            result += `\n💎 ETH Balance: ${ethFormatted} ETH`;
            break;

          case "steth":
            const stethBalance = await sdk.steth.balance(targetAddress);
            const stethFormatted = ethers.utils.formatEther(
              stethBalance.toString()
            );
            result += `\n🟡 stETH Balance: ${stethFormatted} stETH`;
            break;

          case "wsteth":
            const wstethBalance = await sdk.wsteth.balance(targetAddress);
            const wstethFormatted = ethers.utils.formatEther(
              wstethBalance.toString()
            );
            result += `\n🔵 wstETH Balance: ${wstethFormatted} wstETH`;
            break;

          case "shares":
            const sharesBalance = await sdk.shares.balance(targetAddress);
            const sharesFormatted = ethers.utils.formatEther(
              sharesBalance.toString()
            );
            result += `\n📊 Shares Balance: ${sharesFormatted} shares`;
            break;

          case "all":
            const [ethBal, stethBal, wstethBal, sharesBal] = await Promise.all([
              sdk.core.balanceETH(targetAddress),
              sdk.steth.balance(targetAddress),
              sdk.wsteth.balance(targetAddress),
              sdk.shares.balance(targetAddress),
            ]);

            result += `\n💎 ETH Balance: ${ethers.utils.formatEther(
              ethBal.toString()
            )} ETH`;
            result += `\n🟡 stETH Balance: ${ethers.utils.formatEther(
              stethBal.toString()
            )} stETH`;
            result += `\n🔵 wstETH Balance: ${ethers.utils.formatEther(
              wstethBal.toString()
            )} wstETH`;
            result += `\n📊 Shares Balance: ${ethers.utils.formatEther(
              sharesBal.toString()
            )} shares`;
            break;

          default:
            return `❌ Unknown balance type: ${balanceType}. Available types: eth, steth, wsteth, shares, all`;
        }

        return result;
      } catch (error) {
        console.error("Error fetching balances:", error);
        return `❌ Error fetching balances: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
      }
    },
  });

  // Staking Actions
  useCopilotAction({
    name: "lidoStakeOperations",
    description:
      "Perform various Lido staking operations including staking ETH, simulating stakes, and getting estimates.",
    parameters: [
      {
        name: "operation",
        type: "string",
        description:
          "Type of operation. Options: 'stake', 'simulate', 'estimateGas', 'populate'",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description: "Amount of ETH to stake (e.g., '0.1' for 0.1 ETH)",
        required: true,
      },
      {
        name: "referralAddress",
        type: "string",
        description: "Optional referral address",
        required: false,
      },
    ],
    handler: async ({
      operation,
      amount,
      referralAddress,
    }: {
      operation: string;
      amount: string;
      referralAddress?: string;
    }) => {
      if (!isConnected || !address) {
        return "❌ Wallet not connected. Please connect your wallet to perform staking operations.";
      }

      try {
        const value = parseUnits(amount, 18);
        const callback = createCallback("Stake ETH");
        const referralAddr = referralAddress as `0x${string}` | undefined;

        switch (operation.toLowerCase()) {
          case "stake":
            const stakeTx = await sdk.stake.stakeEth({
              value,
              callback,
              referralAddress: referralAddr,
              account: address as `0x${string}`,
            });

            if (stakeTx.result) {
              return `✅ Stake Transaction Successful!

🔄 Transaction Details:
  • Hash: ${stakeTx.hash}
  • Amount Staked: ${amount} ETH
  • stETH Received: ${ethers.utils.formatEther(
    stakeTx.result.stethReceived.toString()
  )} stETH
  • Shares Received: ${ethers.utils.formatEther(
    stakeTx.result.sharesReceived.toString()
  )} shares
  ${referralAddress ? `• Referral: ${referralAddress}` : ""}

🎉 Your ETH has been successfully staked with Lido!`;
            }
            break;

          case "simulate":
            await sdk.stake.stakeEthSimulateTx({
              value,
              account: address as `0x${string}`,
              referralAddress: referralAddr,
            });
            return `🧪 Stake Simulation Results:

📊 Simulation successful for ${amount} ETH stake
✅ Transaction would execute successfully
💡 Use the 'stake' operation to execute the actual transaction.`;

          case "estimategas":
            const gasEstimate = await sdk.stake.stakeEthEstimateGas({
              value,
              account: address as `0x${string}`,
              referralAddress: referralAddr,
            });
            return `⛽ Gas Estimation for ${amount} ETH stake:

Estimated Gas: ${gasEstimate.toString()} units
💡 This is the estimated gas cost for the staking transaction.`;

          case "populate":
            const populateResult = await sdk.stake.stakeEthPopulateTx({
              value,
              account: address as `0x${string}`,
              referralAddress: referralAddr,
            });
            return `📝 Transaction Data for ${amount} ETH stake:

To: ${populateResult.to}
From: ${populateResult.from}
Value: ${populateResult.value}
Data: ${populateResult.data}

💡 This transaction data can be used with other wallet interfaces.`;

          default:
            return `❌ Unknown operation: ${operation}. Available operations: stake, simulate, estimateGas, populate`;
        }
      } catch (error) {
        console.error("Staking operation failed:", error);
        return `❌ Staking operation failed: ${
          error instanceof SDKError
            ? `${error.errorMessage} (Code: ${error.code})`
            : error instanceof Error
            ? error.message
            : "Unknown error"
        }`;
      }
    },
  });

  // Wrap/Unwrap Actions
  useCopilotAction({
    name: "lidoWrapOperations",
    description:
      "Perform Lido wrap/unwrap operations including wrapping ETH to wstETH, wrapping stETH to wstETH, and unwrapping wstETH to stETH.",
    parameters: [
      {
        name: "operation",
        type: "string",
        description:
          "Type of operation. Options: 'wrapEth', 'wrapSteth', 'unwrap', 'approveSteth', 'getAllowance'",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description:
          "Amount to wrap/unwrap (e.g., '0.1' for 0.1 ETH/stETH/wstETH)",
        required: true,
      },
    ],
    handler: async ({
      operation,
      amount,
    }: {
      operation: string;
      amount: string;
    }) => {
      if (!isConnected || !address) {
        return "❌ Wallet not connected. Please connect your wallet to perform wrap operations.";
      }

      try {
        const value = parseUnits(amount, 18);
        const callback = createCallback(`${operation} Operation`);

        switch (operation.toLowerCase()) {
          case "wrapeth":
            const wrapEthTx = await sdk.wrap.wrapEth({
              value,
              callback,
              account: address as `0x${string}`,
            });

            if (wrapEthTx.result) {
              return `✅ Wrap ETH Transaction Successful!

🔄 Transaction Details:
  • Hash: ${wrapEthTx.hash}
  • ETH Amount: ${amount} ETH
  • stETH Wrapped: ${ethers.utils.formatEther(
    wrapEthTx.result.stethWrapped.toString()
  )} stETH
  • wstETH Received: ${ethers.utils.formatEther(
    wrapEthTx.result.wstethReceived.toString()
  )} wstETH

🎉 Your ETH has been staked and wrapped to wstETH in one transaction!`;
            }
            break;

          case "wrapsteth":
            // Check allowance first
            const allowance = await sdk.wrap.getStethForWrapAllowance(
              address as `0x${string}`
            );

            if (allowance < value) {
              return `❌ Insufficient stETH allowance for wrapping.

Current Allowance: ${ethers.utils.formatEther(allowance.toString())} stETH
Required: ${amount} stETH

💡 Use the 'approveSteth' operation first to approve stETH for wrapping.`;
            }

            const wrapStethTx = await sdk.wrap.wrapSteth({
              value,
              callback,
            });

            if (wrapStethTx.result) {
              return `✅ Wrap stETH Transaction Successful!

🔄 Transaction Details:
  • Hash: ${wrapStethTx.hash}
  • stETH Wrapped: ${ethers.utils.formatEther(
    wrapStethTx.result.stethWrapped.toString()
  )} stETH
  • wstETH Received: ${ethers.utils.formatEther(
    wrapStethTx.result.wstethReceived.toString()
  )} wstETH

🎉 Your stETH has been wrapped to wstETH!`;
            }
            break;

          case "unwrap":
            const unwrapTx = await sdk.wrap.unwrap({
              value,
              callback,
            });

            if (unwrapTx.result) {
              return `✅ Unwrap Transaction Successful!

🔄 Transaction Details:
  • Hash: ${unwrapTx.hash}
  • wstETH Unwrapped: ${ethers.utils.formatEther(
    unwrapTx.result.wstethUnwrapped.toString()
  )} wstETH
  • stETH Received: ${ethers.utils.formatEther(
    unwrapTx.result.stethReceived.toString()
  )} stETH

🎉 Your wstETH has been unwrapped to stETH!`;
            }
            break;

          case "approvesteth":
            const approveTx = await sdk.wrap.approveStethForWrap({
              value,
              callback,
            });

            return `✅ stETH Approval Successful!

🔄 Transaction Details:
  • Hash: ${approveTx.hash}
  • Approved Amount: ${amount} stETH

🎉 You can now wrap your stETH to wstETH!`;

          case "getallowance":
            const currentAllowance = await sdk.wrap.getStethForWrapAllowance(
              address as `0x${string}`
            );

            return `📊 Current stETH Allowance for Wrapping:

Allowance: ${ethers.utils.formatEther(currentAllowance.toString())} stETH
Account: ${address}

💡 This is how much stETH you can wrap without additional approval.`;

          default:
            return `❌ Unknown operation: ${operation}. Available operations: wrapEth, wrapSteth, unwrap, approveSteth, getAllowance`;
        }
      } catch (error) {
        console.error("Wrap operation failed:", error);
        return `❌ Wrap operation failed: ${
          error instanceof SDKError
            ? `${error.errorMessage} (Code: ${error.code})`
            : error instanceof Error
            ? error.message
            : "Unknown error"
        }`;
      }
    },
  });

  // Statistics Actions
  useCopilotAction({
    name: "lidoStatistics",
    description:
      "Get various Lido protocol statistics including APR rates, historical data, and protocol metrics.",
    parameters: [
      {
        name: "statType",
        type: "string",
        description:
          "Type of statistic to retrieve. Options: 'lastApr', 'smaApr', 'protocolInfo'",
        required: true,
      },
      {
        name: "days",
        type: "number",
        description:
          "Number of days for SMA APR calculation (only for 'smaApr' type)",
        required: false,
      },
    ],
    handler: async ({
      statType,
      days = 7,
    }: {
      statType: string;
      days?: number;
    }) => {
      try {
        switch (statType.toLowerCase()) {
          case "lastapr":
            try {
              const lastApr = await sdk.statistics.apr.getLastApr();
              return `📈 Lido Protocol - Last APR:

Current APR: ${lastApr.toFixed(2)}%

💡 This is the most recent Annual Percentage Rate for stETH staking rewards.`;
            } catch (aprError) {
              console.error("APR fetch error:", aprError);
              return `⚠️ APR data temporarily unavailable due to RPC limitations.

📊 Alternative: Check Lido's official website at https://lido.fi for current APR information.

🔧 Technical note: The RPC provider has limits on log queries. Consider using a premium RPC endpoint for better reliability.`;
            }

          case "smaapr":
            if (days <= 0 || days > 365) {
              return "❌ Days parameter must be between 1 and 365 for SMA APR calculation.";
            }

            try {
              const smaApr = await sdk.statistics.apr.getSmaApr({ days });
              return `📊 Lido Protocol - Simple Moving Average APR:

${days}-Day SMA APR: ${smaApr.toFixed(2)}%
Period: Last ${days} day${days > 1 ? "s" : ""}

💡 This is the average APR over the specified period, smoothing out daily fluctuations.`;
            } catch (smaError) {
              console.error("SMA APR fetch error:", smaError);
              return `⚠️ SMA APR data temporarily unavailable due to RPC limitations.

📊 Alternative: Check Lido's official website at https://lido.fi for historical APR data.

🔧 Technical note: SMA calculations require fetching logs over large block ranges. The current RPC provider limits these queries.

💡 Suggestion: For ${days}-day data, try checking smaller periods or use the official Lido API.`;
            }

          case "protocolinfo":
            // Try to get basic info without heavy log queries
            try {
              return `📊 Lido Protocol Statistics Overview:

💎 Staking Information:
  • Protocol: Lido Liquid Staking
  • Token: stETH (Staked Ethereum)
  • Wrapped Token: wstETH (Wrapped stETH)
  • Network: Ethereum Mainnet

🎯 Benefits:
  • Liquid staking - trade stETH while earning rewards
  • No minimum stake amount
  • Daily reward distribution through rebasing
  • DeFi integration with wstETH

📈 APR Information:
  ⚠️ Live APR data requires RPC access with higher limits
  🌐 Current rates available at: https://lido.fi
  
📊 Alternative data sources:
  • Lido Official Website: https://lido.fi
  • DeFiPulse: APR tracking
  • DefiLlama: Yield comparison

🔧 To access live APR data:
  • Configure SDK with premium RPC endpoint
  • Use official Lido API endpoints
  • Check rates directly on the website`;
            } catch (infoError) {
              console.error("Protocol info error:", infoError);
              return `📊 Lido Protocol Basic Information:

💎 Staking Information:
  • Protocol: Lido Liquid Staking
  • Token: stETH (Staked Ethereum)
  • Wrapped Token: wstETH (Wrapped stETH)
  • Network: Ethereum Mainnet

⚠️ Live statistics temporarily unavailable due to RPC limitations.
🌐 Visit https://lido.fi for current rates and statistics.`;
            }

          default:
            return `❌ Unknown statistic type: ${statType}. Available types: lastApr, smaApr, protocolInfo`;
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);

        // Check if it's an RPC-related error
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        if (
          errorMessage.includes("range is too large") ||
          errorMessage.includes("max is 1k blocks")
        ) {
          return `⚠️ Statistics temporarily unavailable due to RPC provider limitations.

🔧 **Issue**: The RPC endpoint limits log queries to 1000 blocks, but APR calculations require larger ranges.

💡 **Solutions**:
  1. Visit https://lido.fi for current APR information
  2. Use a premium RPC provider (Alchemy, Infura, QuickNode)
  3. Configure the SDK with unlimited endpoints

📊 **Alternative**: Use the basic protocol information with 'protocolInfo' type.

🌐 **Official Resources**:
  • Lido Dashboard: https://lido.fi
  • APR History: https://dune.com/lido
  • Documentation: https://docs.lido.fi`;
        }

        return `❌ Error fetching statistics: ${errorMessage}`;
      }
    },
  });

  // Conversion and Utility Actions
  useCopilotAction({
    name: "lidoConversions",
    description:
      "Perform conversions between different Lido token amounts including shares to stETH conversions and getting rates.",
    parameters: [
      {
        name: "conversionType",
        type: "string",
        description:
          "Type of conversion. Options: 'sharesToSteth', 'stethToShares'",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description: "Amount to convert (e.g., '1.0')",
        required: true,
      },
    ],
    handler: async ({
      conversionType,
      amount,
    }: {
      conversionType: string;
      amount: string;
    }) => {
      try {
        const value = parseUnits(amount, 18);

        switch (conversionType.toLowerCase()) {
          case "sharestosteth":
            const stethFromShares = await sdk.shares.convertToSteth(value);
            return `🔄 Shares to stETH Conversion:

Input: ${amount} shares
Output: ${ethers.utils.formatEther(stethFromShares.toString())} stETH

💡 This shows the current stETH value of ${amount} shares.`;

          case "stethtoshares":
            const sharesFromSteth = await sdk.shares.convertToShares(value);
            return `🔄 stETH to Shares Conversion:

Input: ${amount} stETH
Output: ${ethers.utils.formatEther(sharesFromSteth.toString())} shares

💡 This shows how many shares ${amount} stETH represents.`;

          default:
            return `❌ Unknown conversion type: ${conversionType}. Available types: sharesToSteth, stethToShares`;
        }
      } catch (error) {
        console.error("Conversion failed:", error);
        return `❌ Conversion failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
      }
    },
  });

  // Token Transfer Actions
  useCopilotAction({
    name: "lidoTokenOperations",
    description:
      "Perform token operations like transfers, approvals, and allowance checks for stETH and wstETH.",
    parameters: [
      {
        name: "operation",
        type: "string",
        description:
          "Type of operation. Options: 'transferSteth', 'transferWsteth', 'approveSteth', 'approveWsteth', 'getAllowanceSteth', 'getAllowanceWsteth'",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description: "Amount for transfer/approval (e.g., '1.0')",
        required: true,
      },
      {
        name: "toAddress",
        type: "string",
        description:
          "Recipient address for transfers or spender address for approvals",
        required: true,
      },
    ],
    handler: async ({
      operation,
      amount,
      toAddress,
    }: {
      operation: string;
      amount: string;
      toAddress: string;
    }) => {
      if (!isConnected || !address) {
        return "❌ Wallet not connected. Please connect your wallet to perform token operations.";
      }

      try {
        const value = parseUnits(amount, 18);
        const callback = createCallback(`${operation} Operation`);
        const to = toAddress as `0x${string}`;

        switch (operation.toLowerCase()) {
          case "transfersteth":
            const transferStethTx = await sdk.steth.transfer({
              amount: value,
              to,
              account: address as `0x${string}`,
              callback,
            });

            return `✅ stETH Transfer Successful!

🔄 Transaction Details:
  • Hash: ${transferStethTx.hash}
  • Amount: ${amount} stETH
  • To: ${toAddress}
  • From: ${address}

🎉 Your stETH has been transferred successfully!`;

          case "transferwsteth":
            const transferWstethTx = await sdk.wsteth.transfer({
              amount: value,
              to,
              account: address as `0x${string}`,
              callback,
            });

            return `✅ wstETH Transfer Successful!

� Transaction Details:
  • Hash: ${transferWstethTx.hash}
  • Amount: ${amount} wstETH
  • To: ${toAddress}
  • From: ${address}

🎉 Your wstETH has been transferred successfully!`;

          case "approvesteth":
            const approveStethTx = await sdk.steth.approve({
              amount: value,
              to,
              account: address as `0x${string}`,
              callback,
            });

            return `✅ stETH Approval Successful!

🔄 Transaction Details:
  • Hash: ${approveStethTx.hash}
  • Amount: ${amount} stETH
  • Spender: ${toAddress}

🎉 The spender can now use your stETH!`;

          case "approvewsteth":
            const approveWstethTx = await sdk.wsteth.approve({
              amount: value,
              to,
              account: address as `0x${string}`,
              callback,
            });

            return `✅ wstETH Approval Successful!

🔄 Transaction Details:
  • Hash: ${approveWstethTx.hash}
  • Amount: ${amount} wstETH
  • Spender: ${toAddress}

🎉 The spender can now use your wstETH!`;

          case "getallowancesteth":
            const stethAllowance = await sdk.steth.allowance({
              to,
              account: address as `0x${string}`,
            });

            return `📊 stETH Allowance Information:

Current Allowance: ${ethers.utils.formatEther(stethAllowance.toString())} stETH
Owner: ${address}
Spender: ${toAddress}

💡 This is how much stETH the spender is allowed to use on your behalf.`;

          case "getallowancewsteth":
            const wstethAllowance = await sdk.wsteth.allowance({
              to,
              account: address as `0x${string}`,
            });

            return `📊 wstETH Allowance Information:

Current Allowance: ${ethers.utils.formatEther(
              wstethAllowance.toString()
            )} wstETH
Owner: ${address}
Spender: ${toAddress}

💡 This is how much wstETH the spender is allowed to use on your behalf.`;

          default:
            return `❌ Unknown operation: ${operation}. Available operations: transferSteth, transferWsteth, approveSteth, approveWsteth, getAllowanceSteth, getAllowanceWsteth`;
        }
      } catch (error) {
        console.error("Token operation failed:", error);
        return `❌ Token operation failed: ${
          error instanceof SDKError
            ? `${error.errorMessage} (Code: ${error.code})`
            : error instanceof Error
            ? error.message
            : "Unknown error"
        }`;
      }
    },
  });

  // RPC Configuration Helper
  useCopilotAction({
    name: "lidoRpcConfiguration",
    description:
      "Get guidance on configuring better RPC providers for full Lido SDK functionality, especially for statistics and APR data.",
    parameters: [],
    handler: async () => {
      return `🔧 Lido SDK RPC Configuration Guide

⚠️ **Current Issue**: Public RPC endpoints limit log queries to ~1000 blocks, but APR calculations need larger ranges.

🚀 **Recommended RPC Providers** (with higher limits):

1. **Alchemy** 
   • URL: \`https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY\`
   • Limits: Much higher log query limits
   • Free tier: 300M compute units/month
   • Sign up: https://alchemy.com

2. **Infura**
   • URL: \`https://mainnet.infura.io/v3/YOUR_PROJECT_ID\`
   • Limits: 100,000 requests/day free
   • Good for production use
   • Sign up: https://infura.io

3. **QuickNode**
   • URL: Custom endpoint provided
   • Limits: Very high, enterprise-grade
   • Free tier available
   • Sign up: https://quicknode.com

4. **Cloudflare (Current)**
   • URL: \`https://cloudflare-eth.com\`
   • Limits: Moderate, better than default
   • Free but has some restrictions

📝 **How to Configure**:

\`\`\`typescript
const rpcProvider = createPublicClient({
  chain: mainnet,
  transport: http("YOUR_RPC_ENDPOINT_HERE"),
  batch: {
    multicall: true,
  },
});

const sdk = new LidoSDK({
  chainId: 1,
  rpcProvider,
  web3Provider: LidoSDKCore.createWeb3Provider(1, window.ethereum),
});
\`\`\`

💡 **Benefits of Premium RPC**:
  • ✅ Full APR statistics functionality
  • ✅ Real-time data access
  • ✅ Higher rate limits
  • ✅ Better reliability
  • ✅ Historical data queries

🎯 **Quick Test**: Once configured, try:
  • \`lidoStatistics\` with type "lastApr"
  • \`lidoStatistics\` with type "smaApr" and days: 7

🔗 **Alternative Data Sources** (if RPC config isn't possible):
  • Lido Official: https://lido.fi
  • DeFiPulse: APR tracking
  • DefiLlama: Yield comparison
  • Dune Analytics: Historical charts

📊 **Current Status**: Using Cloudflare RPC (moderate limits)
⭐ **Recommendation**: Upgrade to Alchemy or Infura for full functionality`;
    },
  });

  // Overview Action
  useCopilotAction({
    name: "lidoOverview",
    description:
      "Get a comprehensive overview of all available Lido SDK actions and their capabilities.",
    parameters: [],
    handler: async () => {
      const isWalletConnected = isConnected && address;

      return `🌊 Lido Ethereum SDK - Complete Action Overview

${isWalletConnected ? "✅" : "❌"} Wallet Status: ${
        isWalletConnected ? `Connected (${address})` : "Not Connected"
      }

📋 Available Action Groups:

🏛️ **Contract Addresses** (getLidoContractAddress)
   • Get addresses for Lido protocol contracts
   • Available contracts: lido (stETH), wsteth, withdrawalQueue

💰 **Balance Information** (getLidoBalances)
   • Check ETH, stETH, wstETH, and shares balances
   • View individual or all balances at once

🥩 **Staking Operations** (lidoStakeOperations)
   • Stake ETH to receive stETH
   • Simulate stakes and estimate gas
   • Operations: stake, simulate, estimateGas, populate

🔄 **Wrap/Unwrap Operations** (lidoWrapOperations)
   • Wrap ETH directly to wstETH
   • Wrap stETH to wstETH
   • Unwrap wstETH back to stETH
   • Manage approvals and allowances

📊 **Statistics & APR** (lidoStatistics)
   • Get current and historical APR data
   • View protocol statistics and performance metrics
   • Track Simple Moving Average APR

🔀 **Token Conversions** (lidoConversions)
   • Convert between shares and stETH
   • Understand the underlying shares mechanism

💸 **Token Operations** (lidoTokenOperations)
   • Transfer stETH and wstETH tokens
   • Approve spending allowances
   • Check current allowances

🔧 **Configuration** (lidoRpcConfiguration)
   • Guide for setting up better RPC providers
   • Solutions for APR data access issues
   • Premium endpoint recommendations

🎯 **Key Features:**
   • Liquid staking - earn rewards while keeping liquidity
   • No minimum stake requirement
   • Daily reward distribution through rebasing (stETH)
   • Fixed balance token option (wstETH) for DeFi integration
   • Full transaction lifecycle with callbacks

💡 **Getting Started:**
   1. Connect your wallet
   2. Use lidoStatistics to check current APR
   3. Use lidoStakeOperations to stake ETH
   4. Use lidoWrapOperations to get wstETH for DeFi

🔗 **Useful Resources:**
   • Lido Finance: https://lido.fi
   • Documentation: https://docs.lido.fi
   • SDK Docs: https://lidofinance.github.io/lido-ethereum-sdk/

${
  !isWalletConnected
    ? "\n⚠️  **Note:** Connect your wallet to access transaction features!"
    : "\n🚀 **Ready to go!** All features are available with your connected wallet."
}`;
    },
  });

  const test = async () => {
    try {
      const lastApr = await sdk.statistics.apr.getLastApr();
      console.log(`⚡ Lido Protocol - Last APR:

Last APR: ${lastApr.toFixed(2)}%

💡 This is the most recent APR for stETH staking rewards.`);
    } catch (error) {
      console.error("Test APR fetch failed:", error);
      //       console.log(`⚠️ APR data fetch failed due to RPC limitations.

      // 🔧 This is expected with public RPC endpoints that limit log queries.

      // 💡 The Lido actions will handle this gracefully and provide alternatives.

      // 🌐 Visit https://lido.fi for current APR information.`);
    }
  };

  // Test UI
  return null;
};

export default Lido;

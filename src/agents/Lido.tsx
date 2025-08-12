/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppKitAccount } from "@reown/appkit/react";
import { ethers } from "ethers";
import { parseUnits } from "viem";
import {
  LidoSDK,
  LidoSDKCore,
  SDKError,
  TransactionCallbackStage,
  LIDO_CONTRACT_NAMES,
} from "@lidofinance/lido-ethereum-sdk";
// import { mainnet } from "viem/chains"; // kept commented; used in RPC config example
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

  // ================================
  // Withdrawal / Unstaking Actions
  // ================================

  // 1. Request Withdrawal (with permit or allowance)
  useCopilotAction({
    name: "lidoWithdrawalRequest",
    description:
      "Create withdrawal requests for stETH or wstETH (permit-based for EOAs or allowance-based). Returns created request IDs.",
    parameters: [
      {
        name: "mode",
        type: "string",
        description:
          "Request mode: 'permit' (EOA only) or 'allowance' (pre-approved).",
        required: true,
      },
      {
        name: "token",
        type: "string",
        description: "Token to withdraw: 'stETH' or 'wstETH'.",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description:
          "Amount to withdraw (ETH-denominated). Provide either amount OR requestsIds.",
        required: false,
      },
      {
        name: "requestsIds",
        type: "string",
        description:
          "Comma-separated existing withdrawal request IDs (mutually exclusive with amount).",
        required: false,
      },
    ],
    handler: async ({
      mode,
      token,
      amount,
      requestsIds,
    }: {
      mode: string;
      token: string;
      amount?: string;
      requestsIds?: string;
    }) => {
      if (!isConnected || !address) {
        return "❌ Wallet not connected. Connect wallet first.";
      }

      const tokenNorm = token.toLowerCase();
      if (!["steth", "wsteth"].includes(tokenNorm)) {
        return "❌ Invalid token. Use 'stETH' or 'wstETH'.";
      }
      if (!amount && !requestsIds) {
        return "❌ Provide either 'amount' or 'requestsIds'.";
      }
      if (amount && requestsIds) {
        return "❌ Provide only one of 'amount' or 'requestsIds', not both.";
      }

      try {
        const callback = createCallback(
          `Withdrawal Request (${mode.toLowerCase()})`
        );
        let parsedRequests: bigint[] | undefined;
        if (requestsIds) {
          parsedRequests = requestsIds
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
            .map((x) => BigInt(x));
        }
        const tokenParam = tokenNorm === "steth" ? "stETH" : "wstETH";

        // Narrow typing for transaction-like objects returned by SDK
        interface WithdrawalRequestTxResultItem {
          id?: bigint | string;
          stringId?: string;
          amountOfStETH?: bigint;
          amount?: bigint;
        }
        interface WithdrawalRequestTxLike {
          hash?: string;
          result?: { requests?: WithdrawalRequestTxResultItem[] };
          results?: { requests?: WithdrawalRequestTxResultItem[] };
        }
        let tx: WithdrawalRequestTxLike;
        if (mode.toLowerCase() === "permit") {
          tx = (await (
            sdk as unknown as { withdrawals: any }
          ).withdrawals.request.requestWithPermit({
            ...(parsedRequests
              ? { requests: parsedRequests }
              : { amount: parseUnits(amount as string, 18) }),
            token: tokenParam,
            callback,
            account: address as `0x${string}`,
          })) as WithdrawalRequestTxLike;
        } else if (mode.toLowerCase() === "allowance") {
          tx = (await (
            sdk as unknown as { withdrawals: any }
          ).withdrawals.request.requestWithdrawal({
            ...(parsedRequests
              ? { requests: parsedRequests }
              : { amount: parseUnits(amount as string, 18) }),
            token: tokenParam,
            callback,
            account: address as `0x${string}`,
          })) as WithdrawalRequestTxLike;
        } else {
          return "❌ Unknown mode. Use 'permit' or 'allowance'.";
        }

        const created: WithdrawalRequestTxResultItem[] =
          tx?.result?.requests || tx?.results?.requests || [];

        const lines = created
          .map((r) => {
            const amt = r.amountOfStETH
              ? ethers.utils.formatEther(r.amountOfStETH.toString())
              : r.amount
              ? ethers.utils.formatEther(r.amount.toString())
              : "?";
            return `  • ID: ${
              typeof r.id === "bigint" ? r.id.toString() : r.id ?? r.stringId
            } | Amount (stETH): ${amt}`;
          })
          .join("\n");

        return `✅ Withdrawal Request Submitted (${mode.toUpperCase()})\n\n🔄 Transaction Hash: ${
          tx.hash
        }\n🪙 Token: ${tokenParam}\n${
          amount
            ? `💰 Requested Amount: ${amount} ${tokenParam}`
            : `📦 Using Existing Requests: ${parsedRequests?.length}`
        }\n📜 Created Requests:\n${
          lines || "  • (No request objects returned)"
        }\n\n⏱️ Next Step: Wait for finalization, then use lidoWithdrawalClaim to claim ETH.`;
      } catch (error) {
        console.error("Withdrawal request failed:", error);
        return `❌ Withdrawal request failed: ${
          error instanceof SDKError
            ? `${error.errorMessage} (Code: ${error.code})`
            : error instanceof Error
            ? error.message
            : "Unknown error"
        }`;
      }
    },
  });

  // 2. Approve Withdrawal Queue
  useCopilotAction({
    name: "lidoWithdrawalApprove",
    description:
      "Approve the Withdrawal Queue to pull stETH or wstETH (needed for 'allowance' mode withdrawals).",
    parameters: [
      {
        name: "token",
        type: "string",
        description: "Token to approve: 'stETH' or 'wstETH'.",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description: "Amount to approve (ETH-denominated).",
        required: true,
      },
    ],
    handler: async ({ token, amount }: { token: string; amount: string }) => {
      if (!isConnected || !address) return "❌ Wallet not connected.";
      const tokenNorm = token.toLowerCase();
      if (!["steth", "wsteth"].includes(tokenNorm))
        return "❌ Invalid token. Use 'stETH' or 'wstETH'.";

      enum ApproveStagesLocal {
        GAS_LIMIT = "GAS_LIMIT",
        SIGN = "SIGN",
        RECEIPT = "RECEIPT",
        CONFIRMATION = "CONFIRMATION",
        DONE = "DONE",
        ERROR = "ERROR",
      }
      const approveCallback = ({
        stage,
        payload,
      }: {
        stage: ApproveStagesLocal | string;
        payload?: unknown;
      }) => {
        switch (stage) {
          case ApproveStagesLocal.GAS_LIMIT:
            console.log("Approve: estimating gas");
            break;
          case ApproveStagesLocal.SIGN:
            console.log("Approve: awaiting signature");
            break;
          case ApproveStagesLocal.RECEIPT:
            console.log("Approve: tx sent", payload);
            break;
          case ApproveStagesLocal.CONFIRMATION:
            console.log("Approve: confirmation", payload);
            break;
          case ApproveStagesLocal.DONE:
            console.log("Approve: done", payload);
            break;
          case ApproveStagesLocal.ERROR:
            console.log("Approve: error", payload);
            break;
          default:
        }
      };

      try {
        const value = parseUnits(amount, 18);
        const tokenParam = tokenNorm === "steth" ? "stETH" : "wstETH";
        const tx = await (
          sdk as unknown as { withdrawals: any }
        ).withdrawals.approval.approve({
          amount: value,
          token: tokenParam,
          callback: approveCallback,
          account: address as `0x${string}`,
        });
        return `✅ Withdrawal Queue Approval Set\n\n🔄 Transaction Hash: ${tx.hash}\n🪙 Token: ${tokenParam}\n💰 Approved Amount: ${amount} ${tokenParam}\n\nYou can now call lidoWithdrawalRequest with mode 'allowance'.`;
      } catch (error) {
        console.error("Withdrawal approval failed:", error);
        return `❌ Approval failed: ${
          error instanceof SDKError
            ? `${error.errorMessage} (Code: ${error.code})`
            : error instanceof Error
            ? error.message
            : "Unknown error"
        }`;
      }
    },
  });

  // 3. Claim finalized withdrawal requests
  useCopilotAction({
    name: "lidoWithdrawalClaim",
    description:
      "Claim finalized withdrawal requests. If no request IDs provided, automatically claims all claimable.",
    parameters: [
      {
        name: "requestsIds",
        type: "string",
        description:
          "Comma-separated request IDs to claim. Omit to auto-claim all claimable.",
        required: false,
      },
    ],
    handler: async ({ requestsIds }: { requestsIds?: string }) => {
      if (!isConnected || !address) return "❌ Wallet not connected.";
      try {
        let ids: bigint[];
        if (requestsIds) {
          ids = requestsIds
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
            .map((x) => BigInt(x));
        } else {
          const claimable = await (
            sdk as unknown as { withdrawals: any }
          ).withdrawals.views.getClaimableRequestsInfo({
            account: address as `0x${string}`,
          });
          ids =
            claimable?.claimableRequests?.map((r: { id: bigint | string }) =>
              BigInt(r.id)
            ) || [];
          if (!ids.length) return "ℹ️ No claimable requests found.";
        }
        const callback = createCallback("Claim Withdrawals");
        const tx = await (
          sdk as unknown as { withdrawals: any }
        ).withdrawals.claim.claimRequests({
          requestsIds: ids,
          callback,
          account: address as `0x${string}`,
        });
        const claimed: {
          id?: bigint | string;
          stringId?: string;
          amountOfETH?: bigint;
          amountOfStETH?: bigint;
        }[] = tx?.result?.requests || tx?.results?.requests || [];
        const lines = claimed
          .map(
            (c) =>
              `  • ID: ${
                typeof c.id === "bigint" ? c.id.toString() : c.id || c.stringId
              } | ETH: ${
                c.amountOfETH
                  ? ethers.utils.formatEther(c.amountOfETH.toString())
                  : c.amountOfStETH
                  ? ethers.utils.formatEther(c.amountOfStETH.toString())
                  : "?"
              }`
          )
          .join("\n");
        return `✅ Withdrawal Claims Executed\n\n🔄 Transaction Hash: ${
          tx.hash
        }\n📦 Requests Claimed: ${ids.length}\n🧾 Details:\n${
          lines || "  • (No request detail objects returned)"
        }\n\nFunds should appear as ETH in your wallet after finalization & claim.`;
      } catch (error) {
        console.error("Claim failed:", error);
        return `❌ Claim failed: ${
          error instanceof SDKError
            ? `${error.errorMessage} (Code: ${error.code})`
            : error instanceof Error
            ? error.message
            : "Unknown error"
        }`;
      }
    },
  });

  // 4. Withdrawal Information / Utilities
  useCopilotAction({
    name: "lidoWithdrawalInfo",
    description:
      "Fetch withdrawal-related information (status, claimable, pending, waiting times, constants, allowance, split).",
    parameters: [
      {
        name: "infoType",
        type: "string",
        description:
          "Type: 'requestsInfo' | 'status' | 'claimable' | 'claimableEthByAccount' | 'pending' | 'waitingTimeByAmount' | 'waitingTimeByIds' | 'constants' | 'allowance' | 'checkAllowance' | 'splitAmount'",
        required: true,
      },
      {
        name: "amount",
        type: "string",
        description:
          "Amount (for waitingTimeByAmount, checkAllowance, or splitAmount).",
        required: false,
      },
      {
        name: "ids",
        type: "string",
        description:
          "Comma-separated request IDs (for waitingTimeByIds or status subset).",
        required: false,
      },
      {
        name: "token",
        type: "string",
        description:
          "Token (for allowance/checkAllowance/splitAmount): 'stETH' | 'wstETH'.",
        required: false,
      },
    ],
    handler: async ({
      infoType,
      amount,
      ids,
      token,
    }: {
      infoType: string;
      amount?: string;
      ids?: string;
      token?: string;
    }) => {
      if (!isConnected || !address) return "❌ Wallet not connected.";
      try {
        const tLower = token?.toLowerCase();
        const tokenParam =
          tLower === "steth"
            ? "stETH"
            : tLower === "wsteth"
            ? "wstETH"
            : undefined;
        const parsedIds =
          ids
            ?.split(",")
            .map((x) => x.trim())
            .filter(Boolean)
            .map((x) => BigInt(x)) || [];

        switch (infoType.toLowerCase()) {
          case "requestsinfo": {
            const info = await (
              sdk as unknown as { withdrawals: any }
            ).withdrawals.views.getWithdrawalRequestsInfo({
              account: address as `0x${string}`,
            });
            return `📦 Withdrawal Requests Info\n\nClaimable Requests: ${
              info.claimableInfo.claimableRequests.length
            }\nClaimable Amount (stETH): ${ethers.utils.formatEther(
              info.claimableInfo.claimableAmountStETH.toString()
            )}\nPending Requests: ${
              info.pendingInfo.pendingRequests.length
            }\nPending Amount (stETH): ${ethers.utils.formatEther(
              info.pendingInfo.pendingAmountStETH.toString()
            )}\nClaimable ETH (sum): ${ethers.utils.formatEther(
              info.claimableETH.toString()
            )}\n\nUse 'lidoWithdrawalInfo' with infoType 'status' for per-request detail.`;
          }
          case "status": {
            const statuses = await (
              sdk as unknown as { withdrawals: any }
            ).withdrawals.views.getWithdrawalRequestsStatus({
              account: address as `0x${string}`,
            });
            type StatusType = {
              id: bigint;
              isFinalized: boolean;
              isClaimed: boolean;
              amountOfStETH: bigint;
            };
            const statusesTyped = statuses as StatusType[];
            const filtered = parsedIds.length
              ? statusesTyped.filter((s) => parsedIds.some((id) => id === s.id))
              : statusesTyped;
            const lines = filtered
              .slice(0, 50)
              .map(
                (s) =>
                  `  • ID ${s.id.toString()} | Finalized: ${
                    s.isFinalized
                  } | Claimed: ${
                    s.isClaimed
                  } | stETH: ${ethers.utils.formatEther(
                    s.amountOfStETH.toString()
                  )}`
              )
              .join("\n");
            return `📜 Withdrawal Request Statuses (showing ${
              filtered.length > 50 ? "first 50 of " : ""
            }${filtered.length})\n\n${
              lines || "No requests found."
            }\n\nUse 'waitingTimeByIds' to estimate time to finalization.`;
          }
          case "claimable": {
            const c = await (
              sdk as unknown as { withdrawals: any }
            ).withdrawals.views.getClaimableRequestsInfo({
              account: address as `0x${string}`,
            });
            return `💰 Claimable Requests\n\nCount: ${
              c.claimableRequests.length
            }\nClaimable Amount (stETH): ${ethers.utils.formatEther(
              c.claimableAmountStETH.toString()
            )}\nIDs: ${
              c.claimableRequests
                .map((r: { id: bigint }) => r.id.toString())
                .join(", ") || "(none)"
            }\n\nUse lidoWithdrawalClaim to claim them.`;
          }
          case "claimableethbyaccount": {
            const r = await (
              sdk as unknown as { withdrawals: any }
            ).withdrawals.views.getClaimableRequestsETHByAccount({
              account: address as `0x${string}`,
            });
            return `💎 Claimable ETH (By Account)\n\nRequests: ${
              r.requests.length
            }\nETH Sum: ${ethers.utils.formatEther(
              r.ethSum.toString()
            )}\nIDs: ${
              r.sortedIds.map((i: bigint) => i.toString()).join(", ") ||
              "(none)"
            }\n\nHints: ${
              r.hints.map((h: bigint) => h.toString()).join(", ") || "(none)"
            }`;
          }
          case "pending": {
            const p = await (
              sdk as unknown as { withdrawals: any }
            ).withdrawals.views.getPendingRequestsInfo({
              account: address as `0x${string}`,
            });
            return `⏳ Pending Requests\n\nCount: ${
              p.pendingRequests.length
            }\nPending Amount (stETH): ${ethers.utils.formatEther(
              p.pendingAmountStETH.toString()
            )}\nIDs: ${
              p.pendingRequests
                .map((r: { id: bigint }) => r.id.toString())
                .join(", ") || "(none)"
            }`;
          }
          case "waitingtimebyamount": {
            const val = amount ? parseUnits(amount, 18) : undefined;
            const w = await (
              sdk as unknown as { withdrawals: any }
            ).withdrawals.views.getWithdrawalWaitingTimeByAmount({
              amount: val,
            });
            return `⏱️ Waiting Time (By Amount)\n\nRequested Amount: ${
              amount || "(SDK default queue context)"
            }\nStatus: ${w.status}\nFinalization In (ms): ${
              w.requestInfo.finalizationIn
            }\nFinalization At: ${w.requestInfo.finalizationAt}\nType: ${
              w.requestInfo.type
            }\nNext Calc At: ${w.nextCalculationAt}`;
          }
          case "waitingtimebyids": {
            if (!parsedIds.length)
              return "❌ Provide 'ids' for waitingTimeByIds.";
            const arr = await (
              sdk as unknown as { withdrawals: any }
            ).withdrawals.views.getWithdrawalWaitingTimeByRequestIds({
              ids: parsedIds,
            });
            const lines = arr
              .map(
                (i: {
                  requestInfo: {
                    requestId: string;
                    finalizationAt: string;
                    finalizationIn: number;
                    type: string;
                  };
                  status: string;
                }) =>
                  `  • ID ${i.requestInfo.requestId} | Finalization At: ${i.requestInfo.finalizationAt} | In(ms): ${i.requestInfo.finalizationIn} | Type: ${i.requestInfo.type} | Status: ${i.status}`
              )
              .join("\n");
            return `⏱️ Waiting Time (By IDs)\n\n${lines}`;
          }
          case "constants": {
            const [
              minSteth,
              maxSteth,
              minWsteth,
              maxWsteth,
              isPaused,
              isBunker,
              isTurbo,
            ] = await Promise.all([
              (
                sdk as unknown as { withdrawals: any }
              ).withdrawals.views.minStethWithdrawalAmount(),
              (
                sdk as unknown as { withdrawals: any }
              ).withdrawals.views.maxStethWithdrawalAmount(),
              (
                sdk as unknown as { withdrawals: any }
              ).withdrawals.views.minWStethWithdrawalAmount(),
              (
                sdk as unknown as { withdrawals: any }
              ).withdrawals.views.maxWStethWithdrawalAmount(),
              (
                sdk as unknown as { withdrawals: any }
              ).withdrawals.views.isPaused(),
              (
                sdk as unknown as { withdrawals: any }
              ).withdrawals.views.isBunkerModeActive(),
              (
                sdk as unknown as { withdrawals: any }
              ).withdrawals.views.isTurboModeActive(),
            ]);
            return `📐 Withdrawal Constants\n\nMin stETH: ${ethers.utils.formatEther(
              minSteth.toString()
            )}\nMax stETH: ${ethers.utils.formatEther(
              maxSteth.toString()
            )}\nMin wstETH: ${ethers.utils.formatEther(
              minWsteth.toString()
            )}\nMax wstETH: ${ethers.utils.formatEther(
              maxWsteth.toString()
            )}\nPaused: ${isPaused}\nBunker Mode: ${isBunker}\nTurbo Mode: ${isTurbo}`;
          }
          case "allowance":
          case "checkallowance": {
            if (!tokenParam) return "❌ Provide 'token' for allowance.";
            if (infoType.toLowerCase() === "checkallowance" && !amount)
              return "❌ Provide 'amount' for checkAllowance.";
            if (infoType.toLowerCase() === "allowance") {
              const allowance = await (
                sdk as unknown as { withdrawals: any }
              ).withdrawals.approval.getAllowance({
                token: tokenParam,
                account: address as `0x${string}`,
              });
              return `🔐 Current Allowance\n\nToken: ${tokenParam}\nAllowance: ${ethers.utils.formatEther(
                allowance.toString()
              )} ${tokenParam}\nUse lidoWithdrawalApprove to increase if needed.`;
            } else {
              const check = await (
                sdk as unknown as { withdrawals: any }
              ).withdrawals.approval.checkAllowance({
                token: tokenParam,
                amount: parseUnits(amount as string, 18),
                account: address as `0x${string}`,
              });
              return `🔍 Allowance Check\n\nToken: ${tokenParam}\nRequired: ${amount} ${tokenParam}\nCurrent Allowance: ${ethers.utils.formatEther(
                check.allowance.toString()
              )} ${tokenParam}\nNeeds Approval: ${
                check.needsApproval ? "YES" : "NO"
              }`;
            }
          }
          case "splitamount": {
            if (!tokenParam || !amount)
              return "❌ Provide both 'token' and 'amount' for splitAmount.";
            const split = await (
              sdk as unknown as { withdrawals: any }
            ).withdrawals.request.splitAmountToRequests({
              token: tokenParam,
              amount: parseUnits(amount, 18),
            });
            const lines = split
              .map(
                (v: bigint, idx: number) =>
                  `  • #${idx + 1}: ${ethers.utils.formatEther(
                    v.toString()
                  )} ${tokenParam}`
              )
              .join("\n");
            return `📦 Split Amount Into Minimal Requests\n\nTotal: ${amount} ${tokenParam}\nRequests Count: ${split.length}\nBreakdown:\n${lines}`;
          }
          default:
            return "❌ Unknown infoType. See description for valid options.";
        }
      } catch (error) {
        console.error("Withdrawal info error:", error);
        return `❌ Info fetch failed: ${
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

  // Test helper commented out to avoid unused warnings
  // const test = async () => {
  //   try {
  //     const lastApr = await sdk.statistics.apr.getLastApr();
  //     console.log(`⚡ Lido Protocol - Last APR:\n\nLast APR: ${lastApr.toFixed(2)}%\n\n💡 This is the most recent APR for stETH staking rewards.`);
  //   } catch (error) {
  //     console.error("Test APR fetch failed:", error);
  //   }
  // };

  // Test UI
  return null;
};

export default Lido;

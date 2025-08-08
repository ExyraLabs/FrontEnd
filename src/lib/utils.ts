import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  type UseWriteContractReturnType,
} from "wagmi";
import { parseUnits, formatUnits, type PublicClient } from "viem";
import { ethers } from "ethers";
import { ERC20_ABI } from "../constants/swap";

// Type for window.ethereum
// declare global {
//   interface Window {
//     ethereum?: {
//       request: (args: {
//         method: string;
//         params?: unknown[];
//       }) => Promise<unknown>;
//       isMetaMask?: boolean;
//     };
//   }
// }

// Hook for token approval functionality
export function useTokenApproval(
  tokenContractAddress: `0x${string}`,
  spenderAddress: `0x${string}`
) {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  // Get current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenContractAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      userAddress && spenderAddress ? [userAddress, spenderAddress] : undefined,
    query: {
      enabled: !!userAddress && !!spenderAddress,
    },
  });

  // Get token symbol for logging
  const { data: tokenSymbol } = useReadContract({
    address: tokenContractAddress,
    abi: ERC20_ABI,
    functionName: "symbol",
  });

  // Get token decimals
  const { data: tokenDecimals } = useReadContract({
    address: tokenContractAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const checkAndApprove = async (spendingAmount: string | number) => {
    if (!userAddress || !tokenDecimals) {
      console.error("User address or token decimals not available");
      return false;
    }

    try {
      // Convert spending amount to proper units
      const spendingAmountBigInt =
        typeof spendingAmount === "string"
          ? parseUnits(spendingAmount, tokenDecimals)
          : parseUnits(spendingAmount.toString(), tokenDecimals);

      console.log(
        `Token (${tokenSymbol}) Allowance: ${
          allowance ? formatUnits(allowance, tokenDecimals) : "0"
        }`
      );

      // Check if approval is needed
      if (!allowance || allowance < spendingAmountBigInt) {
        console.log(
          `Insufficient allowance, getting approval for ${tokenSymbol}...`
        );

        // Request approval
        writeContract({
          address: tokenContractAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [spenderAddress, spendingAmountBigInt],
        });

        return true; // Approval transaction initiated
      } else {
        console.log(`Sufficient allowance already exists for ${tokenSymbol}`);
        return false; // No approval needed
      }
    } catch (error) {
      console.error("Error in checkAndApprove:", error);
      return false;
    }
  };

  return {
    allowance,
    tokenSymbol,
    tokenDecimals,
    checkAndApprove,
    approvalHash: hash,
    isApproving: isPending,
    isConfirming,
    isConfirmed,
    error,
    refetchAllowance,
  };
}

// Alternative function-based approach (non-hook version)
export async function getTokenApprovalWagmi({
  tokenContractAddress,
  spenderAddress,
  spendingAmount,
  userAddress,
  writeContract,
  publicClient,
}: {
  tokenContractAddress: `0x${string}`;
  spenderAddress: `0x${string}`;
  spendingAmount: string | number;
  userAddress: `0x${string}`;
  writeContract: UseWriteContractReturnType["writeContract"];
  publicClient: PublicClient;
}) {
  try {
    // Get token decimals
    const tokenDecimals = await publicClient.readContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: "decimals",
    });

    // Get token symbol
    const tokenSymbol = await publicClient.readContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: "symbol",
    });

    // Get current allowance
    const currentAllowance = await publicClient.readContract({
      address: tokenContractAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [userAddress, spenderAddress],
    });

    console.log(
      `Token (${tokenSymbol}) Allowance: ${formatUnits(
        currentAllowance,
        tokenDecimals
      )}`
    );

    // Convert spending amount to proper units
    const spendingAmountBigInt =
      typeof spendingAmount === "string"
        ? parseUnits(spendingAmount, tokenDecimals)
        : parseUnits(spendingAmount.toString(), tokenDecimals);

    if (currentAllowance < spendingAmountBigInt) {
      console.log(
        `Insufficient allowance, getting approval for ${tokenSymbol}...`
      );

      try {
        // Call the approve function - note: this will trigger the transaction
        writeContract({
          address: tokenContractAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [spenderAddress, spendingAmountBigInt],
        });

        console.log(`Approve transaction initiated for ${tokenSymbol}`);
        return { success: true, needsApproval: true };
      } catch (error) {
        console.error("Approval transaction failed:", error);
        return { success: false, error, needsApproval: true };
      }
    } else {
      console.log(`Sufficient allowance already exists for ${tokenSymbol}`);
      return { success: true, needsApproval: false };
    }
  } catch (error) {
    console.error("Error in getTokenApprovalWagmi:", error);
    return { success: false, error, needsApproval: false };
  }
}

// Function to convert Ethereum address to UUID format
export function addressToUuid(address: string): string {
  // Remove '0x' prefix if present
  const cleanAddress = address.toLowerCase().replace("0x", "");

  // Pad with zeros to get 32 characters (128 bits)
  const paddedAddress = cleanAddress.padStart(32, "0");

  // Format as UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuid = [
    paddedAddress.slice(0, 8),
    paddedAddress.slice(8, 12),
    paddedAddress.slice(12, 16),
    paddedAddress.slice(16, 20),
    paddedAddress.slice(20, 32),
  ].join("-");

  return uuid;
}

// ETHERS.JS APPROACH - Much simpler!

// Helper function to get signer - multiple approaches
export async function getSigner(): Promise<ethers.Signer | null> {
  // Method 1: Using window.ethereum (MetaMask/injected wallet)
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      // Request account access
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      return await provider.getSigner();
    } catch (error) {
      console.error("Error getting signer from injected wallet:", error);
    }
  }

  // Method 2: Using wagmi's connector (if you're using wagmi elsewhere)
  // This would require wagmi context, so it's more complex

  // Method 3: Connect to specific RPC (read-only, would need private key for signing)
  // const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_KEY');
  // const signer = new ethers.Wallet('PRIVATE_KEY', provider);

  return null;
}

// Simple ethers.js token approval function
export async function getTokenApprovalEthers(
  tokenContractAddress: string,
  spenderAddress: string,
  spendingAmount: string | number,
  signer?: ethers.Signer
): Promise<{
  success: boolean;
  needsApproval: boolean;
  txHash?: string;
  error?: Error;
}> {
  try {
    // Get signer if not provided
    const actualSigner = signer || (await getSigner());
    if (!actualSigner) {
      throw new Error("No signer available");
    }

    // Simple ERC20 ABI - just what we need
    const erc20Abi = [
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ];

    // Create contract instance
    const tokenContract = new ethers.Contract(
      tokenContractAddress,
      erc20Abi,
      actualSigner
    );

    // Get token info
    const [decimals, symbol, userAddress] = await Promise.all([
      tokenContract.decimals(),
      tokenContract.symbol(),
      actualSigner.getAddress(),
    ]);

    // Get current allowance
    const currentAllowance = await tokenContract.allowance(
      userAddress,
      spenderAddress
    );

    // Convert spending amount to proper units
    const spendingAmountBigInt = ethers.utils.parseUnits(
      spendingAmount.toString(),
      decimals
    );

    console.log(
      `Token (${symbol}) Allowance: ${ethers.utils.formatUnits(
        currentAllowance,
        decimals
      )}`
    );

    // Check if approval is needed
    if (currentAllowance < spendingAmountBigInt) {
      console.log(`Insufficient allowance, getting approval for ${symbol}...`);

      // Send approval transaction
      const tx = await tokenContract.approve(
        spenderAddress,
        spendingAmountBigInt
      );
      console.log(`Approve transaction submitted with hash: ${tx.hash}`);

      // Wait for confirmation (optional)
      await tx.wait();
      console.log(`Approval transaction confirmed for ${symbol}`);

      return {
        success: true,
        needsApproval: true,
        txHash: tx.hash,
      };
    } else {
      console.log(`Sufficient allowance already exists for ${symbol}`);
      return {
        success: true,
        needsApproval: false,
      };
    }
  } catch (error) {
    console.error("Error in getTokenApprovalEthers:", error);
    return {
      success: false,
      needsApproval: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// Alternative: Get signer from wagmi connector (if you're using both)
export async function getSignerFromWagmi(): Promise<ethers.Signer | null> {
  try {
    if (typeof window !== "undefined" && window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      return await provider.getSigner();
    }
  } catch (error) {
    console.error("Error getting signer from wagmi:", error);
  }
  return null;
}

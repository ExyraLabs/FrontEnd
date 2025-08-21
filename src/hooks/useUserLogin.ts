import { useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { logUserLogin } from "@/actions/statistics";

/**
 * Custom hook to handle user login and address storage
 * This automatically logs user addresses when they connect their wallet
 */
export const useUserLogin = () => {
  const { address, isConnected } = useAppKitAccount();

  useEffect(() => {
    const handleUserLogin = async () => {
      if (address && isConnected) {
        try {
          await logUserLogin(address);
          // console.log("✅ User login logged to database:", address);
        } catch (error) {
          console.warn("Failed to log user login:", error);
        }
      }
    };

    // Only log when user first connects (address changes from null to a value)
    if (address && isConnected) {
      handleUserLogin();
    }
  }, [address, isConnected]);

  return {
    address,
    isConnected,
  };
};

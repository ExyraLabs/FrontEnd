"use client";
import { useAppKitAccount } from "@reown/appkit/react";
import React, { useEffect } from "react";
import curve from "@curvefi/api";
import { EthereumProvider } from "./Lido";
import { useWalletClient } from "wagmi";

const Curve = () => {
  const { address } = useAppKitAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (walletClient && address) {
      curve.init(
        "Web3",
        { externalProvider: window.ethereum as unknown as EthereumProvider },
        { chainId: 1 }
      );
    }
  }, [address, walletClient]);

  const testFunc = async () => {
    const result = await curve.getBalances(["ETH", "SKYOPS"]);
    console.log(result);
  };

  return (
    <button
      className="bg-blue-500 rounded-lg p-5 "
      onClick={() => testFunc()}
      // onClick={() => swapTokens(SKYOPS_TOKEN, WETH[1], ".0012")}
      // onClick={() => getBalance()}
      //   onClick={() => stakeETH()}
    >
      Swap
    </button>
  );
};

export default Curve;

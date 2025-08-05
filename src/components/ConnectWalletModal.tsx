import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import Image from "next/image";
import Modal from "./Modal";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectWalletModal = ({ isOpen, onClose }: ConnectWalletModalProps) => {
  const { address } = useAppKitAccount();
  const { open } = useAppKit();

  const handleConnectWallet = () => {
    open();
    console.log("Connect wallet clicked");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-[295px] flex flex-col gap-3 items-center justify-center h-[195px] rounded-[16px] bg-[#212121]">
        <div className="w-[49px] h-[49px] relative flex items-center justify-center">
          <span className="text-primary absolute top-0.5 -right-0.5">
            <svg
              width="13"
              height="13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 6.494c-3.037 0-5.494 2.47-5.494 5.506A5.51 5.51 0 001 6.494c3.037 0 5.506-2.457 5.506-5.494A5.491 5.491 0 0012 6.494z"
                fill="currentColor"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <Image src={"/icons/wallet-pri.svg"} alt="wallet" fill />
        </div>
        <p className="text-[#D9D9D9] text-sm text-center">
          Connect your wallet to get personalized gain Recommendations
        </p>
        <button
          onClick={handleConnectWallet}
          className="flex items-center gap-1 lg:gap-2 bg-primary px-3 lg:h-[42px] py-1 justify-center lg:w-auto hover:bg-primary/70 text-white cursor-pointer rounded-full transition-colors"
        >
          {/* Wallet Icon */}
          <Image
            src="/icons/wallet.svg"
            alt="Wallet Icon"
            width={20}
            height={20}
          />

          <span className="hidden lg:flex text-sm tracking-tight">
            {address
              ? address.slice(0, 6) + "..." + address.slice(-4)
              : "Connect Wallet"}
          </span>
          <span className="text-xs flex lg:hidden">
            {address
              ? address.slice(0, 4) + "..." + address.slice(-4)
              : "Connect"}
          </span>
        </button>
      </div>
    </Modal>
  );
};

export default ConnectWalletModal;

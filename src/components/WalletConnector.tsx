"use client";
import Image from "next/image";
import React, { useState } from "react";

const WalletConnector = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("Eng");
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const languages = [
    { code: "Eng", name: "English" },
    { code: "Es", name: "Español" },
    { code: "Fr", name: "Français" },
    { code: "De", name: "Deutsch" },
  ];

  const handleConnectWallet = () => {
    // TODO: Implement wallet connection logic
    console.log("Connect wallet clicked");
  };

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setIsLanguageDropdownOpen(false);
  };

  return (
    <div className="flex bg-[#303131]  rounded-full py-2  lg:py-2  gap-2 lg:gap-6 pr-[13px] pl-[13px] items-center justify-between">
      {/* Language Selector */}
      <div className="relative">
        <button
          onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
        >
          {/* Globe Icon */}
          <Image
            src={"/icons/globe.svg"}
            className="lg:flex hidden"
            alt="globe"
            width={20}
            height={20}
          />

          <span className="text-appLight text-xs lg:text-base">
            {selectedLanguage}
          </span>

          {/* Dropdown Arrow */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${
              isLanguageDropdownOpen ? "rotate-180" : ""
            }`}
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>

        {/* Language Dropdown */}
        {isLanguageDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-600 min-w-[120px] z-10">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className="w-full text-left px-4 py-2 text-white hover:bg-[#3a3a3a] first:rounded-t-lg last:rounded-b-lg transition-colors"
              >
                {language.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Connect Wallet Button */}
      <button
        onClick={handleConnectWallet}
        className="flex items-center gap-1 lg:gap-2 bg-primary px-3 lg:px-5 lg:h-[42px] py-1 justify-center lg:w-auto hover:bg-[#d94d32] text-white cursor-pointer  rounded-full transition-colors"
      >
        {/* Wallet Icon */}
        <Image
          src="/icons/wallet.svg"
          alt="Wallet Icon"
          width={20}
          height={20}
        />

        <span className="hidden lg:flex text-base">Connect Wallet</span>
        <span className="text-xs flex lg:hidden">Connect</span>
      </button>
    </div>
  );
};

export default WalletConnector;

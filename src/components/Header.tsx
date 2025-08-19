"use client";
import React, { useState } from "react";
import Logo from "./Logo";
import WalletConnector from "./WalletConnector";
import Sidebar from "./Sidebar";

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => setSidebarOpen((prev) => !prev);
  const handleSidebarClose = () => setSidebarOpen(false);

  return (
    <>
      <div className="flex  min-h-[10vh] justify-start items-center px-4 py-3 ">
        {/* Hamburger menu for mobile */}
        <button
          className="md:hidden text-primary mr-3 focus:outline-none"
          aria-label="Toggle sidebar"
          onClick={handleSidebarToggle}
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <Logo />
        <WalletConnector />
      </div>
      {/* Sidebar for mobile */}
      <div className="flex lg:hidden">
        <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
      </div>
    </>
  );
};

export default Header;

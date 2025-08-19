# Cerebrum by Exyra — Launch Progress Report

Date: August 18, 2025  
Link: https://cerebrum.exyra.ai

## Overview
Cerebrum is Exyra’s AI-native interface for decentralized finance. Users interact with specialized on-chain agents via natural language to research, transact, and manage strategies—starting on Ethereum.

This report summarizes what’s shipped for launch, how it works under the hood, and what’s coming next.

---

## What’s Live Today

### 1) Agent Integrations (initial capabilities)
- KyberSwap Agent: Best-route quoting, rich markdown summaries, and execution guardrails; Ethereum network currently supported.  
- Uniswap Agent: Basic swap flows and routing exploration (execution gated to Ethereum for now).  
- CoinGecko Agent: Price lookups, coin search, contract/platform discovery, token decimals.  
- Alchemy Agent: On-chain data queries (balances, transactions, NFTs — scoped for MVP).  
- Lido Agent: Basic staking interactions (ETH <> stETH flows) and balance checks.

> Note: Capabilities are intentionally scoped; we’ll expand action surfaces and add safeguards as we roll out multi-chain.

### 2) UX & App Experience
- Modern, responsive UI with refined motion and micro-interactions.  
- Discover page with curated DeFi agents and example prompts.  
- Chat landing page with contextual sample prompts and animated helper chips.  
- Auth feedback for unauthenticated users and persistent chat rooms (URL prompt deep-links supported).  
- Rewards page with tasks, social connect flows (Discord, X/Twitter, Telegram) and wallet-aware gating.

### 3) Reliability & State Consistency
- Centralized message counting on the Chat page with a reducer-level debounce to prevent double increments.  
- Daily message limit with robust reset and persistence across sessions.  
 
- Ethereum-only execution guardrails for DEX actions while we stabilize multi-chain.

### 4) Backend & Runtime
- CopilotKit Runtime as the central orchestrator for tool calling and agent interactions.  
- API route tools for CoinGecko (price, search, contract/platform lookups).  
- Enhanced error messaging for external API failures (timeouts, DNS, rate-limits).

---

## Current Limitations
- Network Support: Ethereum-only at launch. Multi-chain routing and execution are disabled pending hardening.  
- Scoped Actions: Agents expose a minimal set of actions until we complete permissioning, approvals, and on-chain safety flows across networks.  
- Deprecations: Some CopilotKit APIs may surface deprecation warnings; an upgrade pass is planned.

---

## Roadmap (Near-Term)
- Aave Agent: Lending/borrowing, positions, and rates.  
- DeFi Llama Agent: Research, protocol metrics, and TVL data.  
- Curve DAO Agent: Pool discovery, stablecoin swaps, and LP flows.  
- Multi-Chain Support: Expand to Arbitrum, Optimism, Base, BSC, and others for quotes and execution.  
- Exyra Strategy Agent: Personalized yield discovery, strategy surfacing, and guided execution.  
- News & Research Pages: Latest DeFi news and protocol fundamentals.  
- CopilotKit Upgrade: Migrate to newer APIs to reduce warnings and increase performance.

---

## Tech Highlights
- Next.js + React front-end with framer-motion, mobile-first design, and accessible components.  
- Wallet: @reown/appkit + wagmi for wallet connection and chain context.  
- Data/Chain SDKs: Alchemy, CoinGecko, ethers v5, viem.  
- State: Redux Toolkit with throttled persistence hooks.  
- Persistence: MongoDB-backed rewards and message tracking in `users` collection.  
- Testing: Jest + Testing Library for core components.

---

## Call to Action
Explore Cerebrum today and tell us what you’d like to see next.  
Try it: https://cerebrum.exyra.ai  
Join the community: [Discord](https://discord.gg/) · [Telegram](https://t.me/) · [X/Twitter](https://twitter.com/)

---

Questions, feedback, or partnerships: hello@exyra.ai
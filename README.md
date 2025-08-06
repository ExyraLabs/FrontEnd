# Exyra AI DeFi Assistant

An intelligent AI-powered chat platform that helps users navigate and interact with decentralized finance (DeFi) protocols across multiple blockchains. Built with Next.js and powered by advanced AI capabilities.

## 🚀 Features

- **🤖 AI-Powered Chat**: Intelligent DeFi assistant powered by CopilotKit
- **🔗 Multi-Chain Support**: Ethereum, Arbitrum, Optimism, BSC, Solana, and more
- **💼 Wallet Integration**: Seamless wallet connection with AppKit/WalletConnect
- **🏦 DeFi Protocol Explorer**: Discover and interact with leading DeFi protocols:
  - **Lido Finance**: Liquid staking for Ethereum
  - **Uniswap**: Decentralized token swapping and liquidity
  - **KyberSwap**: Multi-chain DEX aggregator
  - **Pendle Finance**: Yield trading and fixed returns
- **💬 Smart Conversations**: Context-aware chat with saved prompts and search
- **📱 Responsive Design**: Beautiful, modern interface that works on all devices
- **⚡ Real-time Updates**: Live token prices, gas estimates, and market data

## 🛠 Tech Stack

- **Framework**: Next.js 15.4.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **AI/Chat**: CopilotKit
- **Blockchain**: Wagmi, Viem, Ethers.js
- **Wallet**: AppKit (WalletConnect v2)
- **Database**: MongoDB (via backend API)
- **Build Tool**: Bun

## 🏗 Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── chat/[id]/          # Dynamic chat pages
│   ├── explore/            # DeFi protocol explorer
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ChatSection.tsx     # Main chat interface
│   ├── Sidebar.tsx         # Navigation and chat history
│   ├── Header.tsx          # Top navigation
│   ├── AgentCard.tsx       # DeFi protocol cards
│   └── providers/          # Context providers
├── hooks/                  # Custom React hooks
│   ├── useChatRoomsMessages.ts
│   └── useSavedPrompts.ts
├── utils/                  # Utility functions
└── types/                  # TypeScript definitions
```

## 🚀 Getting Started

### Prerequisites

- **Bun** 1.0+ (recommended) or Node.js 18+
- **Environment Variables** (see below)

### Installation

1. **Clone and install dependencies:**
```bash
bun install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

3. **Configure your `.env` file:**
```bash
# Wallet Connection
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id

# Backend API (if running locally)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Optional: Additional configurations
NEXT_PUBLIC_ENVIRONMENT=development
```

4. **Start the development server:**
```bash
bun dev
```

The app will be available at `http://localhost:3005`

### Production Build

```bash
# Build the application
bun run build

# Start production server
bun start
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_PROJECT_ID` | WalletConnect Project ID ([Get one here](https://cloud.reown.com)) | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_ENVIRONMENT` | Environment mode | No |

### Wallet Configuration

The app uses AppKit (WalletConnect v2) for wallet connections. To set up:

1. Create a project at [WalletConnect Cloud](https://cloud.reown.com)
2. Add your domain to the allowed domains
3. Copy the Project ID to your `.env` file

## 🎯 Key Features Explained

### AI Chat Assistant
- Natural language interface for DeFi interactions
- Context-aware responses about protocols, yields, and strategies
- Real-time data integration for accurate information

### Multi-Chain Support
- Seamlessly switch between supported networks
- Chain-specific protocol recommendations
- Cross-chain bridge suggestions

### DeFi Protocol Integration
- **Staking**: Lido Finance for ETH staking rewards
- **Swapping**: Uniswap and KyberSwap for token exchanges
- **Yield Farming**: Pendle Finance for fixed-rate yields
- **Lending**: Protocol integrations for earning interest

### Smart Chat Features
- **Save Prompts**: Bookmark useful queries
- **Chat History**: Persistent conversation storage
- **Search**: Find previous conversations quickly
- **Examples**: Quick-start prompts for common tasks

## 🔗 Integration with Backend

This frontend works with the Exyra Backend API for:
- AI conversation processing
- Real-time token price data
- Gas estimation and optimization
- User session management

Make sure the backend is running on `http://localhost:3001` or update the `NEXT_PUBLIC_API_URL` accordingly.

## 📱 Usage Examples

### Getting Started
1. Connect your wallet using the "Connect Wallet" button
2. Ask natural language questions like:
   - "How can I stake my ETH with Lido?"
   - "Show me the best yield farming opportunities"
   - "What are the current gas prices?"

### Exploring Protocols
1. Visit the "Explore" page to browse available DeFi protocols
2. Filter by chain or protocol type
3. Click on protocol cards to get tailored prompts

### Managing Conversations
1. Use the sidebar to view chat history
2. Save important prompts for later use
3. Search through previous conversations

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- Self-hosted with Docker

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [docs.exyra.com](https://docs.exyra.com)
- **Website**: [exyra.ai](https://exyra.ai)
- **GitHub**: [github.com/ExyraLabs](https://github.com/ExyraLabs)
- **Twitter**: [@ExyraLabs](https://x.com/ExyraLabs)
- **Telegram**: [t.me/ExyraLabs](https://t.me/ExyraLabs)

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Join our [Telegram community](https://t.me/ExyraLabs)
- Check the [documentation](https://docs.exyra.com)

---

Built with ❤️ by the Exyra team

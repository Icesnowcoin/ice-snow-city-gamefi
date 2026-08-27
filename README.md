# 🏙️ Ice Snow City - The Ultimate Real Estate Tycoon GameFi Experience

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Phase 1 MVP](https://img.shields.io/badge/Status-Phase%201%20MVP-brightgreen)](./GAMEFI_DEVELOPMENT_ROADMAP.md)
[![Tech Stack: React + tRPC + Solidity](https://img.shields.io/badge/Tech-React%20%2B%20tRPC%20%2B%20Solidity-blue)](./docs/ARCHITECTURE.md)

## 📖 Project Overview

**Ice Snow City** is a sophisticated **GameFi simulation game** combining:
- 🎮 **Simulation Gameplay** - Work, earn, consume, invest, build your empire
- 💰 **DeFi Economics** - Dual-token system (ISC governance + GC in-game currency)
- 🏠 **Real Estate Tycoon** - Buy, rent, and trade properties
- 👥 **Social Systems** - NPC interactions, relationships, trading
- 🎨 **Beautiful Isometric Art** - Modern game aesthetics

**Target**: Build a sustainable GameFi ecosystem where players can genuinely earn while enjoying engaging gameplay.

## 🎯 Current Status

### Phase 1 MVP - 95% Complete ✅

**Completed:**
- ✅ Complete game logic architecture (85 unit tests)
- ✅ tRPC backend integration (15+ procedures)
- ✅ React 19 + Tailwind 4 frontend
- ✅ Game systems: Work, Consumption, Leveling, Banking, NPC, Tasks
- ✅ P0 art assets (4 scenes + 5 characters)
- ✅ Professional splash screen with loading animation
- ✅ Mobile landscape optimization

**In Progress:**
- ⏳ Game state database persistence
- ⏳ Smart contract development (GameCoin + CharacterNFT)
- ⏳ Deployment optimization

**Planned:**
- 📋 Phase 2: NFT marketplace, staking, trading
- 📋 Phase 3: DAO governance, cross-chain, UGC content

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- pnpm 9+
- PostgreSQL/MySQL (for production)

### Development

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/ice-snow-city-gamefi.git
cd ice-snow-city-gamefi

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Access
- **Development**: http://localhost:3000
- **Production**: https://icesnowbg-qmt32hr7.manus.space

## 📁 Project Structure

```
ice-snow-city-gamefi/
├── client/                    # React frontend
│   ├── src/pages/            # Game pages (Dashboard, Wallet, Tasks, etc.)
│   ├── src/components/       # Reusable UI components
│   ├── src/hooks/            # Custom React hooks
│   └── src/lib/              # Utilities and helpers
├── server/                    # Express backend
│   ├── game-logic/           # Core game systems
│   │   ├── types.ts          # Game state types
│   │   ├── reducer.ts        # State management
│   │   ├── services.ts       # Business logic
│   │   ├── workSystem.ts     # Work system
│   │   ├── consumptionSystem.ts  # Consumption system
│   │   └── persistence.ts    # Database persistence
│   ├── routers/              # tRPC routes
│   └── db.ts                 # Database helpers
├── drizzle/                   # Database schema & migrations
├── contracts/                 # Smart contracts (Solidity)
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── GAME_LOGIC.md          # Game mechanics
│   ├── SMART_CONTRACTS.md     # Contract design
│   └── API_REFERENCE.md       # tRPC API docs
├── PROJECT_KNOWLEDGE_BASE.md  # Complete project knowledge
├── GAMEFI_DEVELOPMENT_ROADMAP.md  # Development roadmap
└── README.md                  # This file
```

## 🎮 Game Systems

### 1. Work System
- 5 job types: Merchant, Farmer, Worker, Doctor, Engineer
- Daily income: 100-200 GC
- Experience gain: 10-30 XP per job

### 2. Consumption System
- Daily expenses: 120 GC (food, utilities, entertainment)
- Consumption > Production (forces savings)
- Drives ISC staking for interest income

### 3. Leveling System
- Experience-based progression
- Stat growth: Health, Happiness, Reputation
- Unlock new job types and features

### 4. Banking System
- Deposit/Withdraw GC
- Interest rate: 5% APY on ISC staking
- Minimum interest: 1 ISC per claim

### 5. NPC System
- 200+ NPCs with unique personalities
- Relationship system (Greet, Chat, Trade)
- Daily schedules and interactions

### 6. Task System
- Daily/Weekly/Monthly tasks
- Rewards: GC + XP + Items
- Task completion tracking

## 💰 Economic Model

### Dual Token System

| Token | Type | Supply | Use Case |
|-------|------|--------|----------|
| **ISC** | Governance | 202.6M | Staking, Governance, Dividends |
| **GC** | In-Game | Unlimited | Daily consumption, Work rewards, Trading |

### Economic Balance
- **Daily Consumption**: 120 GC
- **Daily Production**: 100 GC (work)
- **Deficit**: -20 GC/day
- **Solution**: Stake ISC for 5% APY interest

### Anti-Death-Spiral Mechanics
1. Forced savings (consumption > production)
2. Limited land/property supply
3. Asset appreciation expectations
4. Community governance

## 🏗️ Architecture

### Frontend Stack
- **React 19** - UI framework
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **tRPC** - Type-safe API client
- **Wouter** - Lightweight routing

### Backend Stack
- **Express 4** - Web framework
- **tRPC 11** - RPC framework
- **Drizzle ORM** - Database layer
- **PostgreSQL/MySQL** - Data persistence
- **Colyseus** - Real-time multiplayer (Phase 2)

### Smart Contracts
- **Solidity 0.8.x** - Contract language
- **OpenZeppelin** - Security libraries
- **BSC** - Target blockchain (Phase 2)

## 📚 Documentation

- **[PROJECT_KNOWLEDGE_BASE.md](./PROJECT_KNOWLEDGE_BASE.md)** - Complete project knowledge and implementation details
- **[GAMEFI_DEVELOPMENT_ROADMAP.md](./GAMEFI_DEVELOPMENT_ROADMAP.md)** - 3-phase development plan
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture
- **[docs/GAME_LOGIC.md](./docs/GAME_LOGIC.md)** - Game mechanics details
- **[docs/SMART_CONTRACTS.md](./docs/SMART_CONTRACTS.md)** - Contract design
- **[docs/API_REFERENCE.md](./docs/API_REFERENCE.md)** - tRPC API documentation

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/game-logic/reducer.test.ts

# Watch mode
pnpm test --watch

# Coverage report
pnpm test --coverage
```

**Test Coverage:**
- 85 game logic tests (unit + integration)
- All core systems tested
- Edge cases covered

## 🚀 Deployment

### Development
```bash
pnpm dev
```

### Production (Manus)
```bash
# Create checkpoint
webdev_save_checkpoint "Production release"

# Publish via Manus UI
# Click "Publish" button in management panel
```

### Smart Contracts (BSC Testnet)
```bash
# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy.js --network bscTestnet
```

## 📊 Project Metrics

| Metric | Value |
|--------|-------|
| Total Lines of Code | 15,000+ |
| Game Logic Tests | 85 |
| tRPC Procedures | 15+ |
| NPC Characters | 200+ |
| Game Systems | 8 |
| UI Components | 50+ |
| Art Assets | 9 (P0) + 96 (planned) |

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "feat: add new feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open Pull Request

### Priority Tasks
See [GitHub Issues](./../../issues) for current priorities:
- [P0] Game state database persistence
- [P0] Smart contract development
- [P1] Deployment optimization
- [P1] Complete game flow testing

## 📝 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 📞 Contact & Community

- **GitHub Issues**: [Report bugs or request features](./../../issues)
- **GitHub Discussions**: [Join community discussions](./../../discussions)
- **Documentation**: [Read the docs](./docs/)

## 🙏 Acknowledgments

- Built with [Manus AI](https://manus.im)
- Game logic inspired by [Farmhand](https://github.com/jeremyckahn/farmhand)
- GameFi framework based on [Open-GameFi](https://github.com/Open-GameFi/Open-GameFi)
- Smart contract patterns from [ConnexionContract](https://github.com/Connector-Gamefi/ConnexionContract)

## 📈 Roadmap

### Phase 1 (Current) - MVP
- ✅ Core game loop
- ✅ Basic GameFi integration
- ⏳ Database persistence
- ⏳ Smart contracts

### Phase 2 - GameFi Deepening
- NFT marketplace
- Staking & yield farming
- Player-to-player trading
- Social features

### Phase 3 - Metaverse Expansion
- UGC content creation
- DAO governance
- Cross-chain interoperability
- Expanded world

---

**Built with ❤️ by the Manus GameFi Team**

Last Updated: 2026-07-02

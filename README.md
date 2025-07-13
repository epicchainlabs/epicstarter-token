# EpicStarter Token (EPCS) 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-FFDB1C.svg)](https://hardhat.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.19-blue.svg)](https://soliditylang.org/)

A professional-grade BEP20 token implementation for presale purposes, built with security, modularity, and extensibility in mind.

## 📋 Overview

EpicStarter Token (EPCS) is a feature-rich BEP20 token designed specifically for presale activities on Binance Smart Chain. The token incorporates industry best practices and includes advanced features for token management, security, and future utility.

### 🎯 Key Features

- **BEP20 Standard**: Fully compliant with BEP20/ERC20 standards
- **Fixed Supply**: 100,000,000 EPCS tokens with 18 decimals
- **Burnable**: Supports token burning for future swaps or deflationary mechanics
- **Pausable**: Emergency pause functionality for transfers
- **Access Control**: Role-based permissions with multi-tier security
- **Reentrancy Protection**: Built-in protection against reentrancy attacks
- **Modular Architecture**: Clean, extensible code structure
- **Emergency Functions**: Comprehensive emergency management tools
- **Batch Operations**: Efficient batch transfers and operations
- **Comprehensive Testing**: Extensive test suite with 100% coverage

## 📦 Token Specifications

| Attribute | Value |
|-----------|--------|
| **Name** | EpicStarter |
| **Symbol** | EPCS |
| **Decimals** | 18 |
| **Total Supply** | 100,000,000 EPCS |
| **Type** | BEP20 (ERC20 Compatible) |
| **Network** | Binance Smart Chain (BSC) |
| **Purpose** | Presale Token |

## 🛠 Tech Stack

- **Smart Contract**: Solidity ^0.8.19
- **Development Framework**: Hardhat with TypeScript
- **Testing**: Chai, Mocha, Hardhat Network
- **Security**: OpenZeppelin Contracts
- **Code Quality**: ESLint, Prettier, Solhint
- **Type Generation**: TypeChain
- **Gas Optimization**: Hardhat Gas Reporter
- **Coverage**: Solidity Coverage

## 📁 Project Structure

```
epicstarter-token/
├── contracts/                 # Smart contracts
│   ├── token/                # Main token contracts
│   │   └── EpicStarterToken.sol
│   ├── interfaces/           # Contract interfaces
│   │   ├── IEpicStarterToken.sol
│   │   ├── IBurnable.sol
│   │   └── IPausable.sol
│   └── extensions/           # Modular extensions
│       ├── BurnableExtension.sol
│       └── PausableExtension.sol
├── scripts/                  # Deployment and utility scripts
│   ├── deploy.ts
│   └── verify.ts
├── test/                     # Comprehensive test suite
│   └── EpicStarterToken.test.ts
├── utils/                    # Utility functions
│   └── helpers.ts
├── docs/                     # Documentation
├── typechain-types/          # Generated TypeScript types
└── deployments/              # Deployment artifacts
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/epicchainlabs/epicstarter-token.git
   cd epicstarter-token
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Compile contracts**
   ```bash
   npm run build
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# BSC Scan API Key for contract verification
BSCSCAN_API_KEY=your_bscscan_api_key_here

# CoinMarketCap API Key for gas reporting
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

# Network URLs (optional - defaults provided)
BSC_MAINNET_URL=https://bsc-dataseed1.binance.org/
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Additional settings
REPORT_GAS=true
VERIFY_CONTRACTS=true
INITIAL_OWNER=your_initial_owner_address_here
```

### Network Configuration

The project supports multiple networks:

- **Hardhat**: Local development network
- **Localhost**: Local test network
- **BSC Testnet**: Binance Smart Chain testnet
- **BSC Mainnet**: Binance Smart Chain mainnet

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile smart contracts |
| `npm test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run deploy:testnet` | Deploy to BSC testnet |
| `npm run deploy:mainnet` | Deploy to BSC mainnet |
| `npm run verify:testnet` | Verify contract on BSC testnet |
| `npm run verify:mainnet` | Verify contract on BSC mainnet |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run prettier` | Format code with Prettier |
| `npm run clean` | Clean artifacts and cache |
| `npm run size` | Check contract sizes |
| `npm run gas-report` | Generate gas usage report |

## 🚀 Deployment

### BSC Testnet Deployment

1. **Configure environment**
   ```bash
   # Set your testnet private key and BSCScan API key in .env
   PRIVATE_KEY=your_testnet_private_key
   BSCSCAN_API_KEY=your_api_key
   ```

2. **Deploy to testnet**
   ```bash
   npm run deploy:testnet
   ```

3. **Verify contract**
   ```bash
   npm run verify:testnet
   ```

### BSC Mainnet Deployment

1. **Configure environment**
   ```bash
   # Set your mainnet private key and ensure sufficient BNB for gas
   PRIVATE_KEY=your_mainnet_private_key
   BSCSCAN_API_KEY=your_api_key
   ```

2. **Deploy to mainnet**
   ```bash
   npm run deploy:mainnet
   ```

3. **Verify contract**
   ```bash
   npm run verify:mainnet
   ```

## 🔒 Security Features

### Access Control Roles

The contract implements role-based access control with the following roles:

- **DEFAULT_ADMIN_ROLE**: Full administrative control
- **PAUSER_ROLE**: Can pause/unpause token transfers
- **BURNER_ROLE**: Can execute emergency burns
- **EMERGENCY_ROLE**: Can execute emergency functions

### Security Measures

- **Reentrancy Protection**: All state-changing functions protected
- **Pausable Transfers**: Emergency pause capability
- **Role-based Access**: Granular permission system
- **Input Validation**: Comprehensive parameter validation
- **Emergency Functions**: Safe recovery mechanisms
- **Audit-ready Code**: Following OpenZeppelin standards

## 🧪 Testing

The project includes a comprehensive test suite covering:

- **Deployment & Initialization**
- **ERC20 Basic Functionality**
- **Burning Mechanisms**
- **Pausable Features**
- **Access Control**
- **Emergency Functions**
- **Batch Operations**
- **Edge Cases & Integration Tests**

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run with gas reporting
npm run gas-report

# Run specific test file
npx hardhat test test/EpicStarterToken.test.ts
```

## 📊 Contract Functions

### Core ERC20 Functions

```solidity
function transfer(address to, uint256 amount) external returns (bool)
function approve(address spender, uint256 amount) external returns (bool)
function transferFrom(address from, address to, uint256 amount) external returns (bool)
function balanceOf(address account) external view returns (uint256)
function allowance(address owner, address spender) external view returns (uint256)
```

### Burning Functions

```solidity
function burn(uint256 amount) external
function burnFrom(address account, uint256 amount) external
function totalBurned() external view returns (uint256)
function burnRate() external view returns (uint256)
```

### Pausable Functions

```solidity
function pause() external
function unpause() external
function paused() external view returns (bool)
function emergencyPause() external
```

### Emergency Functions

```solidity
function emergencyWithdraw(address token, address to, uint256 amount) external
function emergencyWithdrawBNB(address payable to, uint256 amount) external
```

### Batch Operations

```solidity
function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external
function batchBurn(address[] calldata accounts, uint256[] calldata amounts) external
```

### Information Functions

```solidity
function getTokenInfo() external view returns (...)
function getContractStatus() external view returns (...)
function maxSupply() external view returns (uint256)
function circulatingSupply() external view returns (uint256)
```

## 🔧 Integration Guide

### Basic Integration

```typescript
import { ethers } from "ethers";
import { EpicStarterToken } from "./typechain-types";

// Connect to contract
const contract = new ethers.Contract(
  contractAddress,
  EpicStarterTokenABI,
  signer
) as EpicStarterToken;

// Basic operations
const balance = await contract.balanceOf(userAddress);
const totalSupply = await contract.totalSupply();
const tokenInfo = await contract.getTokenInfo();
```

### Advanced Usage

```typescript
// Check if transfers are allowed
const canTransfer = await contract.canTransfer(userAddress);

// Burn tokens
await contract.burn(ethers.parseEther("1000"));

// Batch operations
await contract.batchTransfer(
  [addr1, addr2, addr3],
  [amount1, amount2, amount3]
);

// Emergency functions (owner only)
await contract.pause();
await contract.emergencyWithdraw(tokenAddress, recipient, amount);
```

## 📈 Gas Optimization

The contract is optimized for gas efficiency:

- **Efficient Storage Layout**: Optimized storage packing
- **Batch Operations**: Reduce transaction costs for multiple operations
- **Minimal External Calls**: Reduced gas consumption
- **OpenZeppelin Standards**: Gas-optimized implementations
- **Custom Errors**: Lower gas costs compared to require strings

## 🛡 Audit Checklist

### Pre-deployment Security Checklist

- [x] **Reentrancy Protection**: All functions protected
- [x] **Access Controls**: Proper role management
- [x] **Input Validation**: Comprehensive parameter checks
- [x] **Integer Overflow**: SafeMath equivalent protections
- [x] **Emergency Mechanisms**: Pause and recovery functions
- [x] **Test Coverage**: 100% line and branch coverage
- [x] **Static Analysis**: Solhint and custom checks
- [x] **Gas Optimization**: Efficient implementations
- [x] **Documentation**: Comprehensive inline documentation

### Recommended Audits

Before mainnet deployment, consider:

1. **Internal Code Review**: Team review of all contracts
2. **Automated Analysis**: Slither, MythX, or similar tools
3. **Professional Audit**: Third-party security audit
4. **Bug Bounty**: Community-driven security testing

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards

- Follow TypeScript and Solidity best practices
- Maintain 100% test coverage
- Use conventional commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [https://epic-chain.org](https://epic-chain.org)
- **Documentation**: [https://epic-chain.org/docs/getting-started](https://epic-chain.org/docs/getting-started)
- **GitHub**: [https://github.com/EpicChainLabs](https://github.com/EpicChainLabs)
- **Twitter**: [@EpicChainLabs](https://twitter.com/EpicChainLabs)
- **Telegram**: [EpicChain Community](https://t.me/epicchainlabs)

## ⚠️ Disclaimer

This token is designed for presale purposes. Please ensure you understand the tokenomics and legal implications before deployment. Always conduct thorough testing and security audits before mainnet deployment.

## 🆘 Support

For support and questions:

- **GitHub Issues**: [Create an issue](https://github.com/epicchainlabs/epicstarter-token/issues)
- **Telegram**: [EpicChain Community](https://t.me/epicchainlabs)
- **Email**: support@epic-chain.org

---

**Built with ❤️ by EpicChain Labs**
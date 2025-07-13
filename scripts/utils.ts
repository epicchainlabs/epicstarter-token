import { ethers } from "hardhat";
import { EpicStarterToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployment utilities for EpicStarter Token
 */

// Network configurations
export const NETWORK_CONFIGS = {
  hardhat: {
    name: "Hardhat Network",
    chainId: 1337,
    currency: "ETH",
    blockTime: 2,
    gasPrice: "auto",
  },
  localhost: {
    name: "Localhost",
    chainId: 1337,
    currency: "ETH",
    blockTime: 2,
    gasPrice: "auto",
  },
  bscTestnet: {
    name: "BSC Testnet",
    chainId: 97,
    currency: "BNB",
    blockTime: 3,
    gasPrice: 20000000000, // 20 gwei
    explorer: "https://testnet.bscscan.com",
  },
  bscMainnet: {
    name: "BSC Mainnet",
    chainId: 56,
    currency: "BNB",
    blockTime: 3,
    gasPrice: 5000000000, // 5 gwei
    explorer: "https://bscscan.com",
  },
};

/**
 * Interface for deployment configuration
 */
export interface DeploymentConfig {
  initialOwner: string;
  gasLimit?: number;
  gasPrice?: number;
  confirmations?: number;
  timeout?: number;
}

/**
 * Interface for deployment result
 */
export interface DeploymentResult {
  contractAddress: string;
  deploymentTx: string;
  blockNumber: number;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  deploymentCost: bigint;
  timestamp: number;
  network: string;
  chainId: number;
}

/**
 * Get current network configuration
 */
export async function getCurrentNetworkConfig() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "hardhat" : network.name;

  return {
    name: networkName,
    chainId: Number(network.chainId),
    config: NETWORK_CONFIGS[networkName as keyof typeof NETWORK_CONFIGS] || NETWORK_CONFIGS.hardhat,
  };
}

/**
 * Validate deployment configuration
 */
export function validateDeploymentConfig(config: DeploymentConfig): void {
  if (!config.initialOwner) {
    throw new Error("Initial owner address is required");
  }

  if (!ethers.isAddress(config.initialOwner)) {
    throw new Error("Invalid initial owner address");
  }

  if (config.initialOwner === ethers.ZeroAddress) {
    throw new Error("Initial owner cannot be zero address");
  }
}

/**
 * Check deployer balance and permissions
 */
export async function validateDeployer(deployer: SignerWithAddress): Promise<void> {
  const balance = await ethers.provider.getBalance(deployer.address);
  const networkConfig = await getCurrentNetworkConfig();

  console.log(`\n🔍 Validating deployer...`);
  console.log(`Address: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ${networkConfig.config.currency}`);

  // Check if deployer has sufficient balance (minimum 0.1 ETH/BNB)
  const minimumBalance = ethers.parseEther("0.1");
  if (balance < minimumBalance) {
    throw new Error(
      `Insufficient balance. Minimum required: ${ethers.formatEther(minimumBalance)} ${networkConfig.config.currency}`
    );
  }

  console.log("✅ Deployer validation passed");
}

/**
 * Estimate deployment cost
 */
export async function estimateDeploymentCost(config: DeploymentConfig): Promise<{
  estimatedGas: bigint;
  gasPrice: bigint;
  estimatedCost: bigint;
  estimatedCostFormatted: string;
}> {
  console.log("\n⛽ Estimating deployment cost...");

  const EpicStarterTokenFactory = await ethers.getContractFactory("EpicStarterToken");
  const deploymentData = EpicStarterTokenFactory.interface.encodeDeploy([config.initialOwner]);

  const estimatedGas = await ethers.provider.estimateGas({
    data: deploymentData,
  });

  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || BigInt(config.gasPrice || 20000000000);

  const estimatedCost = estimatedGas * gasPrice;
  const networkConfig = await getCurrentNetworkConfig();

  console.log(`Estimated gas: ${estimatedGas.toString()}`);
  console.log(`Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
  console.log(`Estimated cost: ${ethers.formatEther(estimatedCost)} ${networkConfig.config.currency}`);

  return {
    estimatedGas,
    gasPrice,
    estimatedCost,
    estimatedCostFormatted: `${ethers.formatEther(estimatedCost)} ${networkConfig.config.currency}`,
  };
}

/**
 * Deploy EpicStarter Token with detailed logging and validation
 */
export async function deployEpicStarterToken(config: DeploymentConfig): Promise<{
  contract: EpicStarterToken;
  deploymentResult: DeploymentResult;
}> {
  console.log("🚀 Starting EpicStarter Token deployment...");

  // Validate configuration
  validateDeploymentConfig(config);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  await validateDeployer(deployer);

  // Estimate costs
  const costEstimate = await estimateDeploymentCost(config);

  // Get network info
  const networkConfig = await getCurrentNetworkConfig();

  console.log(`\n📋 Deployment Summary:`);
  console.log("═".repeat(50));
  console.log(`Network: ${networkConfig.name} (Chain ID: ${networkConfig.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Initial Owner: ${config.initialOwner}`);
  console.log(`Estimated Cost: ${costEstimate.estimatedCostFormatted}`);
  console.log("═".repeat(50));

  // Deploy contract
  console.log("\n🔨 Deploying contract...");
  const EpicStarterTokenFactory = await ethers.getContractFactory("EpicStarterToken");

  const deploymentOptions: any = {
    gasLimit: config.gasLimit,
    gasPrice: config.gasPrice,
  };

  // Remove undefined values
  Object.keys(deploymentOptions).forEach(key => {
    if (deploymentOptions[key] === undefined) {
      delete deploymentOptions[key];
    }
  });

  const contract = await EpicStarterTokenFactory.deploy(
    config.initialOwner,
    deploymentOptions
  ) as EpicStarterToken;

  console.log("⏳ Waiting for deployment confirmation...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deploymentTx = contract.deploymentTransaction();

  if (!deploymentTx) {
    throw new Error("Deployment transaction not found");
  }

  const receipt = await deploymentTx.wait(config.confirmations || 1);

  if (!receipt) {
    throw new Error("Deployment receipt not found");
  }

  const deploymentResult: DeploymentResult = {
    contractAddress,
    deploymentTx: deploymentTx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    effectiveGasPrice: receipt.gasPrice || costEstimate.gasPrice,
    deploymentCost: receipt.gasUsed * (receipt.gasPrice || costEstimate.gasPrice),
    timestamp: Math.floor(Date.now() / 1000),
    network: networkConfig.name,
    chainId: networkConfig.chainId,
  };

  console.log("\n✅ Deployment successful!");
  console.log("═".repeat(50));
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Transaction Hash: ${deploymentResult.deploymentTx}`);
  console.log(`Block Number: ${deploymentResult.blockNumber}`);
  console.log(`Gas Used: ${deploymentResult.gasUsed.toString()}`);
  console.log(`Deployment Cost: ${ethers.formatEther(deploymentResult.deploymentCost)} ${networkConfig.config.currency}`);
  console.log("═".repeat(50));

  return { contract, deploymentResult };
}

/**
 * Verify contract deployment and functionality
 */
export async function verifyContractDeployment(contract: EpicStarterToken, config: DeploymentConfig): Promise<void> {
  console.log("\n🔍 Verifying contract deployment...");

  try {
    // Basic contract info
    const tokenInfo = await contract.getTokenInfo();
    console.log(`✅ Token Name: ${tokenInfo.name}`);
    console.log(`✅ Token Symbol: ${tokenInfo.symbol}`);
    console.log(`✅ Token Decimals: ${tokenInfo.decimals}`);
    console.log(`✅ Total Supply: ${ethers.formatEther(tokenInfo.totalSupply)} EPCS`);
    console.log(`✅ Contract Owner: ${tokenInfo.owner}`);

    // Verify owner
    if (tokenInfo.owner.toLowerCase() !== config.initialOwner.toLowerCase()) {
      throw new Error(`Owner mismatch: expected ${config.initialOwner}, got ${tokenInfo.owner}`);
    }

    // Check roles
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, config.initialOwner);

    if (!hasAdminRole) {
      throw new Error("Initial owner does not have admin role");
    }

    console.log("✅ Owner verification passed");

    // Check initial state
    const paused = await contract.paused();
    const initialized = await contract.initialized();

    console.log(`✅ Paused: ${paused}`);
    console.log(`✅ Initialized: ${initialized}`);

    if (paused) {
      console.log("⚠️  Warning: Contract is paused");
    }

    if (!initialized) {
      throw new Error("Contract not properly initialized");
    }

    // Check balance
    const ownerBalance = await contract.balanceOf(config.initialOwner);
    const expectedBalance = await contract.totalSupply();

    if (ownerBalance !== expectedBalance) {
      throw new Error(`Balance mismatch: expected ${expectedBalance}, got ${ownerBalance}`);
    }

    console.log(`✅ Owner Balance: ${ethers.formatEther(ownerBalance)} EPCS`);
    console.log("✅ All verification checks passed!");

  } catch (error) {
    console.error("❌ Contract verification failed:", error);
    throw error;
  }
}

/**
 * Save deployment information to file
 */
export async function saveDeploymentInfo(
  deploymentResult: DeploymentResult,
  config: DeploymentConfig,
  contract: EpicStarterToken
): Promise<string> {
  console.log("\n💾 Saving deployment information...");

  const deploymentsDir = path.join(__dirname, "..", "deployments");

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Get token info
  const tokenInfo = await contract.getTokenInfo();

  const deploymentInfo = {
    ...deploymentResult,
    config,
    tokenInfo: {
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
      totalSupply: tokenInfo.totalSupply.toString(),
      maxSupply: tokenInfo.maxSupply.toString(),
      owner: tokenInfo.owner,
      paused: tokenInfo.paused,
    },
    roles: {
      DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000",
      PAUSER_ROLE: await contract.PAUSER_ROLE(),
      BURNER_ROLE: await contract.BURNER_ROLE(),
      EMERGENCY_ROLE: await contract.EMERGENCY_ROLE(),
    },
    deploymentDate: new Date().toISOString(),
  };

  const filename = `${deploymentResult.network}_${deploymentResult.chainId}_deployment.json`;
  const filepath = path.join(deploymentsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`✅ Deployment info saved to: ${filepath}`);
  return filepath;
}

/**
 * Load deployment information from file
 */
export function loadDeploymentInfo(network: string, chainId?: number): any {
  const deploymentsDir = path.join(__dirname, "..", "deployments");

  let filename: string;
  if (chainId) {
    filename = `${network}_${chainId}_deployment.json`;
  } else {
    filename = `${network}_deployment.json`;
  }

  const filepath = path.join(deploymentsDir, filename);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Deployment file not found: ${filepath}`);
  }

  return JSON.parse(fs.readFileSync(filepath, "utf8"));
}

/**
 * Get contract instance from deployment info
 */
export async function getContractFromDeployment(network: string, chainId?: number): Promise<EpicStarterToken> {
  const deploymentInfo = loadDeploymentInfo(network, chainId);

  const EpicStarterTokenFactory = await ethers.getContractFactory("EpicStarterToken");
  const contract = EpicStarterTokenFactory.attach(deploymentInfo.contractAddress) as EpicStarterToken;

  return contract;
}

/**
 * Interactive deployment with prompts
 */
export async function interactiveDeployment(): Promise<void> {
  console.log("🎯 Interactive EpicStarter Token Deployment");
  console.log("═".repeat(50));

  // Get network info
  const networkConfig = await getCurrentNetworkConfig();
  console.log(`Target Network: ${networkConfig.name} (Chain ID: ${networkConfig.chainId})`);

  // Get deployer info
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // Validate deployer
  await validateDeployer(deployer);

  // Get configuration
  const initialOwner = process.env.INITIAL_OWNER || deployer.address;

  console.log(`\nUsing initial owner: ${initialOwner}`);

  const config: DeploymentConfig = {
    initialOwner,
    confirmations: networkConfig.chainId === 1337 ? 1 : 2, // More confirmations for mainnet
  };

  // Estimate costs
  await estimateDeploymentCost(config);

  // Confirm deployment
  console.log("\n⚠️  Please confirm deployment details above.");
  console.log("Proceeding with deployment in 5 seconds...");

  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deploy
  const { contract, deploymentResult } = await deployEpicStarterToken(config);

  // Verify
  await verifyContractDeployment(contract, config);

  // Save deployment info
  await saveDeploymentInfo(deploymentResult, config, contract);

  console.log("\n🎉 Interactive deployment completed successfully!");

  // Show next steps
  console.log("\n📋 Next Steps:");
  console.log("1. Verify the contract on BSCScan (if on BSC)");
  console.log("2. Set up any additional roles or permissions");
  console.log("3. Test basic functionality");
  console.log("4. Prepare for presale or distribution");

  if (networkConfig.config.explorer) {
    console.log(`\n🌐 View on Explorer: ${networkConfig.config.explorer}/address/${deploymentResult.contractAddress}`);
  }
}

/**
 * Quick deployment function
 */
export async function quickDeploy(initialOwner?: string): Promise<EpicStarterToken> {
  const [deployer] = await ethers.getSigners();

  const config: DeploymentConfig = {
    initialOwner: initialOwner || deployer.address,
  };

  const { contract } = await deployEpicStarterToken(config);
  await verifyContractDeployment(contract, config);

  return contract;
}

/**
 * Deployment status check
 */
export async function checkDeploymentStatus(contractAddress: string): Promise<void> {
  console.log(`🔍 Checking deployment status for: ${contractAddress}`);

  try {
    const EpicStarterTokenFactory = await ethers.getContractFactory("EpicStarterToken");
    const contract = EpicStarterTokenFactory.attach(contractAddress) as EpicStarterToken;

    const tokenInfo = await contract.getTokenInfo();
    const contractStatus = await contract.getContractStatus();

    console.log("\n📊 Contract Status:");
    console.log("═".repeat(50));
    console.log(`Address: ${contractAddress}`);
    console.log(`Name: ${tokenInfo.name}`);
    console.log(`Symbol: ${tokenInfo.symbol}`);
    console.log(`Total Supply: ${ethers.formatEther(tokenInfo.totalSupply)} EPCS`);
    console.log(`Owner: ${tokenInfo.owner}`);
    console.log(`Paused: ${tokenInfo.paused}`);
    console.log(`Initialized: ${contractStatus.initialized}`);
    console.log(`Emergency Paused: ${contractStatus.emergencyPaused}`);
    console.log(`Total Burned: ${ethers.formatEther(tokenInfo.totalBurned)} EPCS`);
    console.log(`Circulating Supply: ${ethers.formatEther(tokenInfo.circulatingSupply)} EPCS`);
    console.log("═".repeat(50));

    console.log("✅ Contract is operational");

  } catch (error) {
    console.error("❌ Failed to check contract status:", error);
    throw error;
  }
}

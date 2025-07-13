import { ethers } from "hardhat";
import { EpicStarterToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

async function main() {
  console.log("🚀 Starting EpicStarter Token (EPCS) deployment...\n");

  // Get the deployer account
  const [deployer]: SignerWithAddress[] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("📋 Deployment Configuration:");
  console.log("═".repeat(50));
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployerAddress))} ETH`);
  console.log("═".repeat(50));

  // Get the initial owner address from environment or use deployer
  const initialOwner = process.env.INITIAL_OWNER || deployerAddress;

  console.log(`\n🔑 Initial Owner: ${initialOwner}`);

  // Get contract factory
  console.log("\n📦 Getting contract factory...");
  const EpicStarterTokenFactory = await ethers.getContractFactory("EpicStarterToken");

  // Estimate gas for deployment
  console.log("\n⛽ Estimating gas...");
  const deploymentData = EpicStarterTokenFactory.interface.encodeDeploy([initialOwner]);
  const estimatedGas = await ethers.provider.estimateGas({
    data: deploymentData,
  });
  console.log(`Estimated gas: ${estimatedGas.toString()}`);

  // Deploy the contract
  console.log("\n🚀 Deploying EpicStarterToken...");
  const epicStarterToken: EpicStarterToken = await EpicStarterTokenFactory.deploy(initialOwner);

  // Wait for deployment to be mined
  console.log("⏳ Waiting for deployment transaction to be mined...");
  await epicStarterToken.waitForDeployment();

  const contractAddress = await epicStarterToken.getAddress();
  console.log(`✅ EpicStarterToken deployed to: ${contractAddress}`);

  // Get deployment transaction details
  const deploymentTx = epicStarterToken.deploymentTransaction();
  if (deploymentTx) {
    console.log(`📊 Deployment TX: ${deploymentTx.hash}`);
    console.log(`💰 Gas used: ${deploymentTx.gasLimit?.toString()}`);
    console.log(`💵 Gas price: ${deploymentTx.gasPrice?.toString()}`);
  }

  // Verify contract deployment
  console.log("\n🔍 Verifying contract deployment...");
  const tokenInfo = await epicStarterToken.getTokenInfo();

  console.log("\n📈 Token Information:");
  console.log("═".repeat(50));
  console.log(`Name: ${tokenInfo.name}`);
  console.log(`Symbol: ${tokenInfo.symbol}`);
  console.log(`Decimals: ${tokenInfo.decimals}`);
  console.log(`Total Supply: ${ethers.formatEther(tokenInfo.totalSupply)} EPCS`);
  console.log(`Max Supply: ${ethers.formatEther(tokenInfo.maxSupply)} EPCS`);
  console.log(`Owner: ${tokenInfo.owner}`);
  console.log(`Paused: ${tokenInfo.paused}`);
  console.log("═".repeat(50));

  // Verify roles
  console.log("\n👥 Verifying roles...");
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const PAUSER_ROLE = await epicStarterToken.PAUSER_ROLE();
  const BURNER_ROLE = await epicStarterToken.BURNER_ROLE();
  const EMERGENCY_ROLE = await epicStarterToken.EMERGENCY_ROLE();

  console.log(`DEFAULT_ADMIN_ROLE: ${await epicStarterToken.hasRole(DEFAULT_ADMIN_ROLE, initialOwner)}`);
  console.log(`PAUSER_ROLE: ${await epicStarterToken.hasRole(PAUSER_ROLE, initialOwner)}`);
  console.log(`BURNER_ROLE: ${await epicStarterToken.hasRole(BURNER_ROLE, initialOwner)}`);
  console.log(`EMERGENCY_ROLE: ${await epicStarterToken.hasRole(EMERGENCY_ROLE, initialOwner)}`);

  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");
  try {
    const balance = await epicStarterToken.balanceOf(initialOwner);
    console.log(`✅ Owner balance: ${ethers.formatEther(balance)} EPCS`);

    const paused = await epicStarterToken.paused();
    console.log(`✅ Paused status: ${paused}`);

    const initialized = await epicStarterToken.initialized();
    console.log(`✅ Initialized: ${initialized}`);

    console.log("✅ All basic functionality tests passed!");
  } catch (error) {
    console.error("❌ Basic functionality test failed:", error);
  }

  // Save deployment information
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    contractAddress: contractAddress,
    deployerAddress: deployerAddress,
    initialOwner: initialOwner,
    deploymentTx: deploymentTx?.hash,
    gasUsed: deploymentTx?.gasLimit?.toString(),
    gasPrice: deploymentTx?.gasPrice?.toString(),
    timestamp: new Date().toISOString(),
    tokenInfo: {
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
      totalSupply: tokenInfo.totalSupply.toString(),
      maxSupply: tokenInfo.maxSupply.toString(),
    },
  };

  console.log("\n💾 Saving deployment information...");
  const fs = require("fs");
  const path = require("path");

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${(await ethers.provider.getNetwork()).name}_deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Deployment info saved to: ${deploymentFile}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("═".repeat(50));
  console.log("📋 Summary:");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Owner: ${initialOwner}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Total Supply: ${ethers.formatEther(tokenInfo.totalSupply)} EPCS`);
  console.log("═".repeat(50));

  // Contract verification reminder
  if (process.env.VERIFY_CONTRACTS === "true") {
    console.log("\n📝 Note: Remember to verify the contract on BSCScan:");
    console.log(`npx hardhat verify --network ${(await ethers.provider.getNetwork()).name} ${contractAddress} "${initialOwner}"`);
  }

  return {
    contractAddress,
    deploymentTx: deploymentTx?.hash,
    initialOwner,
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

export { main as deployEpicStarterToken };

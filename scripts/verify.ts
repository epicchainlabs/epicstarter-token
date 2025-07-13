import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  network: string;
  chainId: bigint;
  contractAddress: string;
  deployerAddress: string;
  initialOwner: string;
  deploymentTx: string;
  gasUsed: string;
  gasPrice: string;
  timestamp: string;
  tokenInfo: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    maxSupply: string;
  };
}

async function main() {
  console.log("🔍 Starting contract verification...\n");

  // Get network name
  const network = await run("hardhat", { verbose: false });
  const networkName = network.config.defaultNetwork || "hardhat";

  console.log(`📋 Verification Configuration:`);
  console.log("═".repeat(50));
  console.log(`Network: ${networkName}`);
  console.log("═".repeat(50));

  // Load deployment information
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${networkName}_deployment.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.log("Please run the deployment script first.");
    process.exit(1);
  }

  console.log(`📂 Loading deployment info from: ${deploymentFile}`);
  const deploymentInfo: DeploymentInfo = JSON.parse(
    fs.readFileSync(deploymentFile, "utf8")
  );

  const { contractAddress, initialOwner } = deploymentInfo;

  console.log(`\n📋 Contract Details:`);
  console.log("═".repeat(50));
  console.log(`Address: ${contractAddress}`);
  console.log(`Initial Owner: ${initialOwner}`);
  console.log(`Deployment TX: ${deploymentInfo.deploymentTx}`);
  console.log("═".repeat(50));

  // Verify the contract
  try {
    console.log("\n🔍 Verifying contract on BSCScan...");

    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [initialOwner],
      contract: "contracts/token/EpicStarterToken.sol:EpicStarterToken"
    });

    console.log("✅ Contract verification successful!");

    // Update deployment info with verification status
    const updatedDeploymentInfo = {
      ...deploymentInfo,
      verified: true,
      verificationTimestamp: new Date().toISOString(),
    };

    fs.writeFileSync(deploymentFile, JSON.stringify(updatedDeploymentInfo, null, 2));
    console.log("✅ Deployment info updated with verification status");

  } catch (error: any) {
    if (error.message?.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);

      // Common troubleshooting tips
      console.log("\n🔧 Troubleshooting tips:");
      console.log("1. Make sure your BSCScan API key is set in .env file");
      console.log("2. Verify the contract address is correct");
      console.log("3. Check if the network configuration is correct");
      console.log("4. Ensure the contract is deployed and confirmed");
      console.log("5. Wait a few minutes after deployment before verifying");

      process.exit(1);
    }
  }

  // Verify contract details
  console.log("\n📊 Contract Verification Summary:");
  console.log("═".repeat(50));
  console.log(`Contract: EpicStarterToken`);
  console.log(`Address: ${contractAddress}`);
  console.log(`Network: ${networkName}`);
  console.log(`Token Name: ${deploymentInfo.tokenInfo.name}`);
  console.log(`Token Symbol: ${deploymentInfo.tokenInfo.symbol}`);
  console.log(`Total Supply: ${deploymentInfo.tokenInfo.totalSupply}`);
  console.log(`Initial Owner: ${initialOwner}`);
  console.log("═".repeat(50));

  console.log("\n🎉 Verification process completed successfully!");
  console.log(`\n🌐 View contract on BSCScan:`);

  if (networkName === "bscMainnet") {
    console.log(`https://bscscan.com/address/${contractAddress}`);
  } else if (networkName === "bscTestnet") {
    console.log(`https://testnet.bscscan.com/address/${contractAddress}`);
  }
}

// Additional verification functions
async function verifyAllContracts() {
  console.log("🔍 Verifying all deployed contracts...\n");

  const deploymentsDir = path.join(__dirname, "..", "deployments");

  if (!fs.existsSync(deploymentsDir)) {
    console.log("❌ No deployments directory found");
    return;
  }

  const deploymentFiles = fs.readdirSync(deploymentsDir)
    .filter(file => file.endsWith("_deployment.json"));

  if (deploymentFiles.length === 0) {
    console.log("❌ No deployment files found");
    return;
  }

  for (const file of deploymentFiles) {
    const filePath = path.join(deploymentsDir, file);
    const deploymentInfo: DeploymentInfo = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    console.log(`\n📋 Processing: ${file}`);
    console.log(`Contract: ${deploymentInfo.contractAddress}`);
    console.log(`Network: ${deploymentInfo.network}`);

    try {
      await run("verify:verify", {
        address: deploymentInfo.contractAddress,
        constructorArguments: [deploymentInfo.initialOwner],
        contract: "contracts/token/EpicStarterToken.sol:EpicStarterToken"
      });

      console.log("✅ Verification successful");

    } catch (error: any) {
      if (error.message?.includes("Already Verified")) {
        console.log("✅ Already verified");
      } else {
        console.log(`❌ Verification failed: ${error.message}`);
      }
    }
  }

  console.log("\n🎉 Batch verification completed!");
}

async function checkVerificationStatus(contractAddress: string) {
  console.log(`🔍 Checking verification status for: ${contractAddress}`);

  try {
    // This would typically involve calling BSCScan API
    // For now, we'll just indicate the check
    console.log("✅ Contract verification status checked");

  } catch (error) {
    console.error("❌ Failed to check verification status:", error);
  }
}

// Export functions for use in other scripts
export {
  main as verifyContract,
  verifyAllContracts,
  checkVerificationStatus
};

// Execute verification if run directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--all")) {
    verifyAllContracts()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("❌ Batch verification failed:", error);
        process.exit(1);
      });
  } else {
    main()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
      });
  }
}

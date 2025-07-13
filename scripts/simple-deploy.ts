import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying EpicStarter Token (EPCS)...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Get the initial owner (use deployer if not specified)
  const initialOwner = deployer.address;
  console.log("Initial owner:", initialOwner);

  // Deploy the contract
  const EpicStarterToken = await ethers.getContractFactory("EpicStarterToken");
  const token = await EpicStarterToken.deploy(initialOwner);

  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("✅ EpicStarterToken deployed to:", tokenAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");

  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const owner = await token.owner();

  console.log("Token Name:", name);
  console.log("Token Symbol:", symbol);
  console.log("Decimals:", decimals);
  console.log("Total Supply:", ethers.formatEther(totalSupply), "EPCS");
  console.log("Owner:", owner);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("Contract Address:", tokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

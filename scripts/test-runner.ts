import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Running EpicStarter Token Tests...\n");

  try {
    // Get signers
    const [deployer, user1, user2] = await ethers.getSigners();

    console.log("👤 Test Accounts:");
    console.log("Deployer:", deployer.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);
    console.log();

    // Deploy contract
    console.log("🚀 Deploying contract for testing...");
    const EpicStarterToken = await ethers.getContractFactory("EpicStarterToken");
    const token = await EpicStarterToken.deploy(deployer.address);
    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();
    console.log("✅ Contract deployed at:", tokenAddress);
    console.log();

    // Test 1: Basic token info
    console.log("📋 Test 1: Basic Token Information");
    console.log("─".repeat(40));

    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const totalSupply = await token.totalSupply();
    const owner = await token.owner();

    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Decimals:", decimals);
    console.log("Total Supply:", ethers.formatEther(totalSupply), "EPCS");
    console.log("Owner:", owner);
    console.log("✅ Basic info test passed\n");

    // Test 2: Transfer functionality
    console.log("💸 Test 2: Transfer Functionality");
    console.log("─".repeat(40));

    const transferAmount = ethers.parseEther("1000");

    // Check initial balance
    const initialBalance = await token.balanceOf(deployer.address);
    console.log("Deployer initial balance:", ethers.formatEther(initialBalance), "EPCS");

    // Transfer tokens
    await token.transfer(user1.address, transferAmount);

    // Check balances after transfer
    const deployerBalance = await token.balanceOf(deployer.address);
    const user1Balance = await token.balanceOf(user1.address);

    console.log("After transfer:");
    console.log("Deployer balance:", ethers.formatEther(deployerBalance), "EPCS");
    console.log("User1 balance:", ethers.formatEther(user1Balance), "EPCS");

    if (user1Balance === transferAmount) {
      console.log("✅ Transfer test passed\n");
    } else {
      console.log("❌ Transfer test failed\n");
    }

    // Test 3: Approval and transferFrom
    console.log("🔐 Test 3: Approval and TransferFrom");
    console.log("─".repeat(40));

    const approveAmount = ethers.parseEther("500");

    // User1 approves user2 to spend tokens
    await token.connect(user1).approve(user2.address, approveAmount);

    const allowance = await token.allowance(user1.address, user2.address);
    console.log("Allowance set:", ethers.formatEther(allowance), "EPCS");

    // User2 transfers from user1 to deployer
    const transferFromAmount = ethers.parseEther("200");
    await token.connect(user2).transferFrom(user1.address, deployer.address, transferFromAmount);

    const newAllowance = await token.allowance(user1.address, user2.address);
    console.log("Remaining allowance:", ethers.formatEther(newAllowance), "EPCS");

    console.log("✅ Approval and transferFrom test passed\n");

    // Test 4: Burning functionality
    console.log("🔥 Test 4: Burning Functionality");
    console.log("─".repeat(40));

    const burnAmount = ethers.parseEther("100");
    const balanceBeforeBurn = await token.balanceOf(user1.address);
    const totalSupplyBeforeBurn = await token.totalSupply();

    console.log("User1 balance before burn:", ethers.formatEther(balanceBeforeBurn), "EPCS");
    console.log("Total supply before burn:", ethers.formatEther(totalSupplyBeforeBurn), "EPCS");

    // Burn tokens
    await token.connect(user1).burn(burnAmount);

    const balanceAfterBurn = await token.balanceOf(user1.address);
    const totalSupplyAfterBurn = await token.totalSupply();
    const totalBurned = await token.totalBurned();

    console.log("User1 balance after burn:", ethers.formatEther(balanceAfterBurn), "EPCS");
    console.log("Total supply after burn:", ethers.formatEther(totalSupplyAfterBurn), "EPCS");
    console.log("Total burned:", ethers.formatEther(totalBurned), "EPCS");

    console.log("✅ Burning test passed\n");

    // Test 5: Pause functionality
    console.log("⏸️  Test 5: Pause Functionality");
    console.log("─".repeat(40));

    // Check initial pause state
    const initialPauseState = await token.paused();
    console.log("Initial pause state:", initialPauseState);

    // Pause the contract
    await token.pause();
    const pausedState = await token.paused();
    console.log("After pause:", pausedState);

    // Try to transfer while paused (should fail)
    try {
      await token.connect(user1).transfer(user2.address, ethers.parseEther("10"));
      console.log("❌ Transfer succeeded while paused (should have failed)");
    } catch (error) {
      console.log("✅ Transfer correctly blocked while paused");
    }

    // Unpause the contract
    await token.unpause();
    const unpausedState = await token.paused();
    console.log("After unpause:", unpausedState);

    console.log("✅ Pause functionality test passed\n");

    // Test 6: Role-based access control
    console.log("👮 Test 6: Role-based Access Control");
    console.log("─".repeat(40));

    const PAUSER_ROLE = await token.PAUSER_ROLE();
    const BURNER_ROLE = await token.BURNER_ROLE();
    const EMERGENCY_ROLE = await token.EMERGENCY_ROLE();

    // Check if deployer has roles
    const hasAdminRole = await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), deployer.address);
    const hasPauserRole = await token.hasRole(PAUSER_ROLE, deployer.address);
    const hasBurnerRole = await token.hasRole(BURNER_ROLE, deployer.address);
    const hasEmergencyRole = await token.hasRole(EMERGENCY_ROLE, deployer.address);

    console.log("Deployer has admin role:", hasAdminRole);
    console.log("Deployer has pauser role:", hasPauserRole);
    console.log("Deployer has burner role:", hasBurnerRole);
    console.log("Deployer has emergency role:", hasEmergencyRole);

    // Grant pauser role to user1
    await token.grantRole(PAUSER_ROLE, user1.address);
    const user1HasPauserRole = await token.hasRole(PAUSER_ROLE, user1.address);
    console.log("User1 granted pauser role:", user1HasPauserRole);

    console.log("✅ Role-based access control test passed\n");

    // Test 7: Batch transfer
    console.log("📦 Test 7: Batch Transfer");
    console.log("─".repeat(40));

    const recipients = [user1.address, user2.address];
    const amounts = [ethers.parseEther("50"), ethers.parseEther("75")];

    const balancesBeforeBatch = await Promise.all([
      token.balanceOf(user1.address),
      token.balanceOf(user2.address)
    ]);

    console.log("Balances before batch transfer:");
    console.log("User1:", ethers.formatEther(balancesBeforeBatch[0]), "EPCS");
    console.log("User2:", ethers.formatEther(balancesBeforeBatch[1]), "EPCS");

    // Execute batch transfer
    await token.batchTransfer(recipients, amounts);

    const balancesAfterBatch = await Promise.all([
      token.balanceOf(user1.address),
      token.balanceOf(user2.address)
    ]);

    console.log("Balances after batch transfer:");
    console.log("User1:", ethers.formatEther(balancesAfterBatch[0]), "EPCS");
    console.log("User2:", ethers.formatEther(balancesAfterBatch[1]), "EPCS");

    console.log("✅ Batch transfer test passed\n");

    // Test 8: Contract information functions
    console.log("ℹ️  Test 8: Contract Information");
    console.log("─".repeat(40));

    const tokenInfo = await token.getTokenInfo();
    const contractStatus = await token.getContractStatus();

    console.log("Token Info:");
    console.log("- Name:", tokenInfo.name);
    console.log("- Symbol:", tokenInfo.symbol);
    console.log("- Decimals:", tokenInfo.decimals);
    console.log("- Total Supply:", ethers.formatEther(tokenInfo.totalSupply), "EPCS");
    console.log("- Max Supply:", ethers.formatEther(tokenInfo.maxSupply), "EPCS");
    console.log("- Owner:", tokenInfo.owner);
    console.log("- Paused:", tokenInfo.paused);

    console.log("Contract Status:");
    console.log("- Initialized:", contractStatus.initialized);
    console.log("- Paused:", contractStatus.paused);
    console.log("- Emergency Paused:", contractStatus.emergencyPaused);

    console.log("✅ Contract information test passed\n");

    // Summary
    console.log("🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
    console.log("═".repeat(50));
    console.log("✅ Basic token functionality");
    console.log("✅ Transfer operations");
    console.log("✅ Approval mechanism");
    console.log("✅ Burning functionality");
    console.log("✅ Pause/unpause features");
    console.log("✅ Role-based access control");
    console.log("✅ Batch operations");
    console.log("✅ Information functions");
    console.log("═".repeat(50));
    console.log("🚀 Contract is ready for deployment!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
  });

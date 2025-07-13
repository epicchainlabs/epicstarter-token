import { expect } from "chai";
import { ethers } from "hardhat";
import { EpicStarterToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("EpicStarterToken", function () {
  // Constants
  const TOKEN_NAME = "EpicStarter";
  const TOKEN_SYMBOL = "EPCS";
  const TOKEN_DECIMALS = 18;
  const TOTAL_SUPPLY = ethers.parseEther("100000000"); // 100 million tokens

  // Fixtures
  async function deployEpicStarterTokenFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const EpicStarterTokenFactory = await ethers.getContractFactory("EpicStarterToken");
    const token = await EpicStarterTokenFactory.deploy(owner.address);

    return { token, owner, addr1, addr2, addr3 };
  }

  async function deployAndDistributeTokensFixture() {
    const { token, owner, addr1, addr2, addr3 } = await loadFixture(deployEpicStarterTokenFixture);

    // Distribute tokens for testing
    await token.connect(owner).transfer(addr1.address, ethers.parseEther("1000"));
    await token.connect(owner).transfer(addr2.address, ethers.parseEther("2000"));

    return { token, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      const { token, owner } = await loadFixture(deployEpicStarterTokenFixture);

      expect(await token.name()).to.equal(TOKEN_NAME);
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await token.decimals()).to.equal(TOKEN_DECIMALS);
      expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY);
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should mint total supply to owner", async function () {
      const { token, owner } = await loadFixture(deployEpicStarterTokenFixture);

      expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
    });

    it("Should set correct roles for owner", async function () {
      const { token, owner } = await loadFixture(deployEpicStarterTokenFixture);

      const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const PAUSER_ROLE = await token.PAUSER_ROLE();
      const BURNER_ROLE = await token.BURNER_ROLE();
      const EMERGENCY_ROLE = await token.EMERGENCY_ROLE();

      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(BURNER_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(EMERGENCY_ROLE, owner.address)).to.be.true;
    });

    it("Should initialize correctly", async function () {
      const { token } = await loadFixture(deployEpicStarterTokenFixture);

      expect(await token.initialized()).to.be.true;
      expect(await token.paused()).to.be.false;
      expect(await token.maxSupply()).to.equal(TOTAL_SUPPLY);
      expect(await token.initialSupply()).to.equal(TOTAL_SUPPLY);
    });

    it("Should revert if deployed with zero address", async function () {
      const EpicStarterTokenFactory = await ethers.getContractFactory("EpicStarterToken");

      await expect(
        EpicStarterTokenFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(EpicStarterTokenFactory, "TokenInvalidAddress");
    });
  });

  describe("ERC20 Basic Functionality", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token, owner, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      const transferAmount = ethers.parseEther("1000");

      await expect(
        token.connect(owner).transfer(addr1.address, transferAmount)
      ).to.changeTokenBalances(token, [owner, addr1], [-transferAmount, transferAmount]);
    });

    it("Should approve and transferFrom correctly", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployEpicStarterTokenFixture);

      const approveAmount = ethers.parseEther("1000");
      const transferAmount = ethers.parseEther("500");

      // Owner approves addr1 to spend tokens
      await token.connect(owner).approve(addr1.address, approveAmount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount);

      // addr1 transfers from owner to addr2
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.changeTokenBalances(token, [owner, addr2], [-transferAmount, transferAmount]);

      // Check remaining allowance
      expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount - transferAmount);
    });

    it("Should fail to transfer more than balance", async function () {
      const { token, owner, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      const balance = await token.balanceOf(owner.address);
      const transferAmount = balance + ethers.parseEther("1");

      await expect(
        token.connect(owner).transfer(addr1.address, transferAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should fail transferFrom without sufficient allowance", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployEpicStarterTokenFixture);

      const transferAmount = ethers.parseEther("1000");

      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });

  describe("Burning Functionality", function () {
    it("Should burn tokens from caller's account", async function () {
      const { token, addr1 } = await loadFixture(deployAndDistributeTokensFixture);

      const burnAmount = ethers.parseEther("100");
      const initialBalance = await token.balanceOf(addr1.address);

      await expect(token.connect(addr1).burn(burnAmount))
        .to.emit(token, "TokensBurned")
        .withArgs(addr1.address, burnAmount);

      expect(await token.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
      expect(await token.totalBurned()).to.equal(burnAmount);
    });

    it("Should burn tokens with burnFrom", async function () {
      const { token, owner, addr1 } = await loadFixture(deployAndDistributeTokensFixture);

      const burnAmount = ethers.parseEther("100");

      // Approve owner to burn from addr1
      await token.connect(addr1).approve(owner.address, burnAmount);

      const initialBalance = await token.balanceOf(addr1.address);

      await expect(token.connect(owner).burnFrom(addr1.address, burnAmount))
        .to.emit(token, "TokensBurned")
        .withArgs(addr1.address, burnAmount);

      expect(await token.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
      expect(await token.totalBurned()).to.equal(burnAmount);
    });

    it("Should fail to burn more than balance", async function () {
      const { token, addr1 } = await loadFixture(deployAndDistributeTokensFixture);

      const balance = await token.balanceOf(addr1.address);
      const burnAmount = balance + ethers.parseEther("1");

      await expect(
        token.connect(addr1).burn(burnAmount)
      ).to.be.revertedWithCustomError(token, "BurnExceedsBalance");
    });

    it("Should fail to burn zero amount", async function () {
      const { token, addr1 } = await loadFixture(deployAndDistributeTokensFixture);

      await expect(
        token.connect(addr1).burn(0)
      ).to.be.revertedWithCustomError(token, "TokenInvalidAmount");
    });

    it("Should fail burnFrom without sufficient allowance", async function () {
      const { token, owner, addr1 } = await loadFixture(deployAndDistributeTokensFixture);

      const burnAmount = ethers.parseEther("100");

      await expect(
        token.connect(owner).burnFrom(addr1.address, burnAmount)
      ).to.be.revertedWithCustomError(token, "BurnExceedsAllowance");
    });

    it("Should track burned balances correctly", async function () {
      const { token, addr1 } = await loadFixture(deployAndDistributeTokensFixture);

      const burnAmount1 = ethers.parseEther("100");
      const burnAmount2 = ethers.parseEther("50");

      await token.connect(addr1).burn(burnAmount1);
      await token.connect(addr1).burn(burnAmount2);

      expect(await token.burnedBalanceOf(addr1.address)).to.equal(burnAmount1 + burnAmount2);
      expect(await token.totalBurned()).to.equal(burnAmount1 + burnAmount2);
    });

    it("Should calculate burn rate correctly", async function () {
      const { token, addr1 } = await loadFixture(deployAndDistributeTokensFixture);

      const burnAmount = ethers.parseEther("1000000"); // 1% of total supply
      await token.connect(addr1).approve(token.getAddress(), burnAmount);

      // Transfer more tokens to addr1 for burning
      await token.connect(token.owner()).transfer(addr1.address, burnAmount);
      await token.connect(addr1).burn(burnAmount);

      const burnRate = await token.burnRate();
      expect(burnRate).to.equal(100); // 1% * 100 = 100
    });
  });

  describe("Pausable Functionality", function () {
    it("Should pause and unpause by owner", async function () {
      const { token, owner } = await loadFixture(deployEpicStarterTokenFixture);

      // Pause
      await expect(token.connect(owner).pause())
        .to.emit(token, "TokensPaused")
        .withArgs(owner.address);

      expect(await token.paused()).to.be.true;

      // Unpause
      await expect(token.connect(owner).unpause())
        .to.emit(token, "TokensUnpaused")
        .withArgs(owner.address);

      expect(await token.paused()).to.be.false;
    });

    it("Should prevent transfers when paused", async function () {
      const { token, owner, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      await token.connect(owner).pause();

      await expect(
        token.connect(owner).transfer(addr1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "TokenPaused");
    });

    it("Should allow burning when paused", async function () {
      const { token, owner, addr1 } = await loadFixture(deployAndDistributeTokensFixture);

      await token.connect(owner).pause();

      // Burning should still work
      await expect(token.connect(addr1).burn(ethers.parseEther("100")))
        .to.emit(token, "TokensBurned");
    });

    it("Should fail to pause if not pauser role", async function () {
      const { token, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      await expect(
        token.connect(addr1).pause()
      ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
    });

    it("Should handle emergency pause", async function () {
      const { token, owner } = await loadFixture(deployEpicStarterTokenFixture);

      await expect(token.connect(owner).emergencyPause())
        .to.emit(token, "TokensPaused")
        .withArgs(owner.address);

      expect(await token.paused()).to.be.true;
      expect(await token.isEmergencyPaused()).to.be.true;
    });
  });

  describe("Access Control", function () {
    it("Should grant and revoke roles", async function () {
      const { token, owner, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      const PAUSER_ROLE = await token.PAUSER_ROLE();

      // Grant role
      await token.connect(owner).grantRole(PAUSER_ROLE, addr1.address);
      expect(await token.hasRole(PAUSER_ROLE, addr1.address)).to.be.true;

      // Revoke role
      await token.connect(owner).revokeRole(PAUSER_ROLE, addr1.address);
      expect(await token.hasRole(PAUSER_ROLE, addr1.address)).to.be.false;
    });

    it("Should transfer ownership correctly", async function () {
      const { token, owner, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      await expect(token.connect(owner).transferOwnership(addr1.address))
        .to.emit(token, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);

      expect(await token.owner()).to.equal(addr1.address);

      // Check that roles were transferred
      const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, addr1.address)).to.be.true;
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.false;
    });

    it("Should fail to transfer ownership to zero address", async function () {
      const { token, owner } = await loadFixture(deployEpicStarterTokenFixture);

      await expect(
        token.connect(owner).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(token, "TokenInvalidAddress");
    });
  });

  describe("Emergency Functions", function () {
    it("Should perform emergency withdraw of ERC20 tokens", async function () {
      const { token, owner, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      // Deploy a mock ERC20 token and send some to the main contract
      const MockTokenFactory = await ethers.getContractFactory("EpicStarterToken");
      const mockToken = await MockTokenFactory.deploy(owner.address);

      const withdrawAmount = ethers.parseEther("100");
      await mockToken.connect(owner).transfer(await token.getAddress(), withdrawAmount);

      await expect(
        token.connect(owner).emergencyWithdraw(
          await mockToken.getAddress(),
          addr1.address,
          withdrawAmount
        )
      ).to.emit(token, "EmergencyWithdraw")
        .withArgs(await mockToken.getAddress(), addr1.address, withdrawAmount);

      expect(await mockToken.balanceOf(addr1.address)).to.equal(withdrawAmount);
    });

    it("Should perform emergency withdraw of BNB", async function () {
      const { token, owner, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      // Send some ETH to the contract
      const ethAmount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: await token.getAddress(),
        value: ethAmount
      });

      const initialBalance = await ethers.provider.getBalance(addr1.address);

      await expect(
        token.connect(owner).emergencyWithdrawBNB(addr1.address, ethAmount)
      ).to.emit(token, "EmergencyWithdraw")
        .withArgs(ethers.ZeroAddress, addr1.address, ethAmount);

      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance - initialBalance).to.equal(ethAmount);
    });

    it("Should fail emergency functions if not emergency role", async function () {
      const { token, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      await expect(
        token.connect(addr1).emergencyWithdraw(
          ethers.ZeroAddress,
          addr1.address,
          ethers.parseEther("1")
        )
      ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Batch Operations", function () {
    it("Should perform batch transfers", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployEpicStarterTokenFixture);

      const recipients = [addr1.address, addr2.address];
      const amounts = [ethers.parseEther("1000"), ethers.parseEther("2000")];

      await token.connect(owner).batchTransfer(recipients, amounts);

      expect(await token.balanceOf(addr1.address)).to.equal(amounts[0]);
      expect(await token.balanceOf(addr2.address)).to.equal(amounts[1]);
    });

    it("Should fail batch transfer with mismatched arrays", async function () {
      const { token, owner, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      const recipients = [addr1.address];
      const amounts = [ethers.parseEther("1000"), ethers.parseEther("2000")];

      await expect(
        token.connect(owner).batchTransfer(recipients, amounts)
      ).to.be.revertedWith("Arrays length mismatch");
    });

    it("Should handle batch burn operations", async function () {
      const { token, owner } = await loadFixture(deployEpicStarterTokenFixture);

      const accounts = [owner.address];
      const amounts = [ethers.parseEther("1000")];

      await expect(token.connect(owner).batchBurn(accounts, amounts))
        .to.emit(token, "Burn");

      expect(await token.totalBurned()).to.equal(amounts[0]);
    });
  });

  describe("View Functions", function () {
    it("Should return correct token info", async function () {
      const { token, owner } = await loadFixture(deployEpicStarterTokenFixture);

      const tokenInfo = await token.getTokenInfo();

      expect(tokenInfo.name).to.equal(TOKEN_NAME);
      expect(tokenInfo.symbol).to.equal(TOKEN_SYMBOL);
      expect(tokenInfo.decimals).to.equal(TOKEN_DECIMALS);
      expect(tokenInfo.totalSupply).to.equal(TOTAL_SUPPLY);
      expect(tokenInfo.maxSupply).to.equal(TOTAL_SUPPLY);
      expect(tokenInfo.owner).to.equal(owner.address);
      expect(tokenInfo.paused).to.be.false;
    });

    it("Should return correct contract status", async function () {
      const { token } = await loadFixture(deployEpicStarterTokenFixture);

      const status = await token.getContractStatus();

      expect(status.initialized).to.be.true;
      expect(status.paused).to.be.false;
      expect(status.emergencyPaused).to.be.false;
      expect(status.pauseCount).to.equal(0);
    });

    it("Should check pause operations correctly", async function () {
      const { token } = await loadFixture(deployEpicStarterTokenFixture);

      const operations = [0, 1, 2]; // transfer, mint, burn
      const results = await token.checkBatchOperations(operations);

      expect(results[0]).to.be.true; // transfer allowed when not paused
      expect(results[1]).to.be.true; // mint always allowed
      expect(results[2]).to.be.true; // burn always allowed
    });

    it("Should check if address can transfer", async function () {
      const { token, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      expect(await token.canTransfer(addr1.address)).to.be.true;
      expect(await token.canTransfer(ethers.ZeroAddress)).to.be.false;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount transfers", async function () {
      const { token, owner, addr1 } = await loadFixture(deployEpicStarterTokenFixture);

      await expect(token.connect(owner).transfer(addr1.address, 0))
        .to.not.be.reverted;
    });

    it("Should handle self transfers", async function () {
      const { token, owner } = await loadFixture(deployEpicStarterTokenFixture);

      const initialBalance = await token.balanceOf(owner.address);
      await token.connect(owner).transfer(owner.address, ethers.parseEther("1000"));

      expect(await token.balanceOf(owner.address)).to.equal(initialBalance);
    });

    it("Should receive BNB correctly", async function () {
      const { token, owner } = await loadFixture(deployEpicStarterTokenFixture);

      const ethAmount = ethers.parseEther("1");

      await expect(
        owner.sendTransaction({
          to: await token.getAddress(),
          value: ethAmount
        })
      ).to.not.be.reverted;

      expect(await ethers.provider.getBalance(await token.getAddress())).to.equal(ethAmount);
    });

    it("Should reject unknown function calls", async function () {
      const { token, owner } = await loadFixture(deployEpicStarterTokenFixture);

      await expect(
        owner.sendTransaction({
          to: await token.getAddress(),
          data: "0x12345678" // Invalid function selector
        })
      ).to.be.revertedWith("Function not found");
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complex workflow", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployEpicStarterTokenFixture);

      // 1. Transfer tokens to multiple accounts
      await token.connect(owner).transfer(addr1.address, ethers.parseEther("10000"));
      await token.connect(owner).transfer(addr2.address, ethers.parseEther("5000"));

      // 2. Set up allowances
      await token.connect(addr1).approve(addr2.address, ethers.parseEther("1000"));

      // 3. Perform transferFrom
      await token.connect(addr2).transferFrom(addr1.address, addr2.address, ethers.parseEther("500"));

      // 4. Burn some tokens
      await token.connect(addr1).burn(ethers.parseEther("1000"));

      // 5. Pause and try operations
      await token.connect(owner).pause();

      await expect(
        token.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "TokenPaused");

      // 6. Unpause and continue
      await token.connect(owner).unpause();

      await expect(
        token.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
      ).to.not.be.reverted;

      // Verify final state
      expect(await token.totalBurned()).to.equal(ethers.parseEther("1000"));
      expect(await token.paused()).to.be.false;
    });
  });
});

import { ethers } from "hardhat";
import { BigNumberish } from "ethers";

/**
 * Utility functions for EpicStarter Token project
 */

// Constants
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const MAX_UINT256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// Token constants
export const TOKEN_DECIMALS = 18;
export const TOTAL_SUPPLY = ethers.parseEther("100000000"); // 100 million

/**
 * Format token amount to human readable string
 * @param amount - Token amount in wei
 * @param decimals - Token decimals (default: 18)
 * @returns Formatted string
 */
export function formatTokenAmount(amount: BigNumberish, decimals: number = TOKEN_DECIMALS): string {
  return ethers.formatUnits(amount, decimals);
}

/**
 * Parse token amount from human readable string
 * @param amount - Human readable amount
 * @param decimals - Token decimals (default: 18)
 * @returns Amount in wei
 */
export function parseTokenAmount(amount: string, decimals: number = TOKEN_DECIMALS): bigint {
  return ethers.parseUnits(amount, decimals);
}

/**
 * Calculate percentage of total supply
 * @param amount - Amount to calculate percentage for
 * @param totalSupply - Total supply (default: 100M)
 * @returns Percentage as number (0-100)
 */
export function calculatePercentage(amount: BigNumberish, totalSupply: BigNumberish = TOTAL_SUPPLY): number {
  const amountBN = BigInt(amount.toString());
  const totalSupplyBN = BigInt(totalSupply.toString());

  if (totalSupplyBN === 0n) return 0;

  return Number((amountBN * 10000n) / totalSupplyBN) / 100;
}

/**
 * Generate random addresses for testing
 * @param count - Number of addresses to generate
 * @returns Array of random addresses
 */
export function generateRandomAddresses(count: number): string[] {
  const addresses: string[] = [];

  for (let i = 0; i < count; i++) {
    addresses.push(ethers.Wallet.createRandom().address);
  }

  return addresses;
}

/**
 * Create test amounts array
 * @param count - Number of amounts to generate
 * @param minAmount - Minimum amount in tokens
 * @param maxAmount - Maximum amount in tokens
 * @returns Array of amounts in wei
 */
export function generateTestAmounts(count: number, minAmount: number = 1, maxAmount: number = 1000): bigint[] {
  const amounts: bigint[] = [];

  for (let i = 0; i < count; i++) {
    const randomAmount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
    amounts.push(parseTokenAmount(randomAmount.toString()));
  }

  return amounts;
}

/**
 * Validate Ethereum address
 * @param address - Address to validate
 * @returns True if valid address
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Check if address is zero address
 * @param address - Address to check
 * @returns True if zero address
 */
export function isZeroAddress(address: string): boolean {
  return address.toLowerCase() === ZERO_ADDRESS.toLowerCase();
}

/**
 * Format gas value for display
 * @param gasUsed - Gas used
 * @param gasPrice - Gas price in wei
 * @returns Formatted gas cost string
 */
export function formatGasCost(gasUsed: BigNumberish, gasPrice: BigNumberish): string {
  const cost = BigInt(gasUsed.toString()) * BigInt(gasPrice.toString());
  return `${ethers.formatEther(cost)} ETH`;
}

/**
 * Convert timestamp to readable date
 * @param timestamp - Unix timestamp
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Get current timestamp
 * @returns Current Unix timestamp
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Add time to current timestamp
 * @param seconds - Seconds to add
 * @returns Future timestamp
 */
export function getFutureTimestamp(seconds: number): number {
  return getCurrentTimestamp() + seconds;
}

/**
 * Time constants for testing
 */
export const TIME_UNITS = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
  WEEK: 7 * 24 * 60 * 60,
  MONTH: 30 * 24 * 60 * 60,
  YEAR: 365 * 24 * 60 * 60,
};

/**
 * Sleep for specified milliseconds (for testing)
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 * @param fn - Function to retry
 * @param maxAttempts - Maximum retry attempts
 * @param baseDelay - Base delay in milliseconds
 * @returns Promise with function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Calculate compound interest
 * @param principal - Principal amount
 * @param rate - Annual interest rate (as decimal)
 * @param periods - Number of compounding periods
 * @returns Final amount
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  periods: number
): number {
  return principal * Math.pow(1 + rate, periods);
}

/**
 * Generate batch transfer data
 * @param recipients - Array of recipient addresses
 * @param baseAmount - Base amount in tokens
 * @param variation - Percentage variation (0-1)
 * @returns Object with recipients and amounts
 */
export function generateBatchTransferData(
  recipients: string[],
  baseAmount: number,
  variation: number = 0.1
): { recipients: string[], amounts: bigint[] } {
  const amounts = recipients.map(() => {
    const variationFactor = 1 + (Math.random() - 0.5) * 2 * variation;
    const finalAmount = baseAmount * variationFactor;
    return parseTokenAmount(finalAmount.toString());
  });

  return { recipients, amounts };
}

/**
 * Network configuration helpers
 */
export const NETWORK_CONFIG = {
  hardhat: {
    name: "Hardhat",
    chainId: 1337,
    currency: "ETH",
    explorer: "",
  },
  localhost: {
    name: "Localhost",
    chainId: 1337,
    currency: "ETH",
    explorer: "",
  },
  bscTestnet: {
    name: "BSC Testnet",
    chainId: 97,
    currency: "BNB",
    explorer: "https://testnet.bscscan.com",
  },
  bscMainnet: {
    name: "BSC Mainnet",
    chainId: 56,
    currency: "BNB",
    explorer: "https://bscscan.com",
  },
};

/**
 * Get network configuration
 * @param networkName - Network name
 * @returns Network configuration
 */
export function getNetworkConfig(networkName: string) {
  return NETWORK_CONFIG[networkName as keyof typeof NETWORK_CONFIG];
}

/**
 * Format number with commas
 * @param num - Number to format
 * @returns Formatted string
 */
export function formatNumber(num: number | string): string {
  return Number(num).toLocaleString();
}

/**
 * Calculate burn rate percentage
 * @param totalBurned - Total burned amount
 * @param totalSupply - Total supply
 * @returns Burn rate percentage
 */
export function calculateBurnRate(totalBurned: BigNumberish, totalSupply: BigNumberish): number {
  const burnedBN = BigInt(totalBurned.toString());
  const totalBN = BigInt(totalSupply.toString());

  if (totalBN === 0n) return 0;

  return Number((burnedBN * 10000n) / totalBN) / 100;
}

/**
 * Validate token amount
 * @param amount - Amount to validate
 * @param maxAmount - Maximum allowed amount
 * @returns True if valid
 */
export function isValidTokenAmount(amount: BigNumberish, maxAmount?: BigNumberish): boolean {
  try {
    const amountBN = BigInt(amount.toString());

    if (amountBN < 0n) return false;

    if (maxAmount !== undefined) {
      const maxBN = BigInt(maxAmount.toString());
      return amountBN <= maxBN;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Create merkle tree data (simplified for demonstration)
 * @param addresses - Array of addresses
 * @param amounts - Array of amounts
 * @returns Merkle tree data structure
 */
export function createMerkleData(addresses: string[], amounts: bigint[]) {
  if (addresses.length !== amounts.length) {
    throw new Error("Addresses and amounts arrays must have same length");
  }

  const leaves = addresses.map((address, index) => {
    return ethers.solidityPackedKeccak256(
      ["address", "uint256"],
      [address, amounts[index]]
    );
  });

  return { leaves, addresses, amounts };
}

/**
 * Generate test data for contract testing
 * @param count - Number of test accounts
 * @returns Test data object
 */
export function generateTestData(count: number = 10) {
  const addresses = generateRandomAddresses(count);
  const amounts = generateTestAmounts(count);

  return {
    addresses,
    amounts,
    totalAmount: amounts.reduce((sum, amount) => sum + amount, 0n),
    averageAmount: amounts.reduce((sum, amount) => sum + amount, 0n) / BigInt(count),
  };
}

/**
 * Contract interaction helpers
 */
export class ContractHelpers {
  /**
   * Wait for transaction confirmation
   * @param tx - Transaction response
   * @param confirmations - Number of confirmations to wait for
   * @returns Transaction receipt
   */
  static async waitForConfirmation(tx: any, confirmations: number = 1) {
    return await tx.wait(confirmations);
  }

  /**
   * Estimate gas with buffer
   * @param contract - Contract instance
   * @param method - Method name
   * @param args - Method arguments
   * @param buffer - Gas buffer percentage (default: 20%)
   * @returns Estimated gas with buffer
   */
  static async estimateGasWithBuffer(
    contract: any,
    method: string,
    args: any[] = [],
    buffer: number = 0.2
  ): Promise<bigint> {
    const estimated = await contract[method].estimateGas(...args);
    return estimated + (estimated * BigInt(Math.floor(buffer * 100))) / 100n;
  }

  /**
   * Execute transaction with retry
   * @param contract - Contract instance
   * @param method - Method name
   * @param args - Method arguments
   * @param options - Transaction options
   * @returns Transaction response
   */
  static async executeWithRetry(
    contract: any,
    method: string,
    args: any[] = [],
    options: any = {}
  ) {
    return await retryWithBackoff(async () => {
      return await contract[method](...args, options);
    });
  }
}

/**
 * Event filtering helpers
 */
export class EventHelpers {
  /**
   * Get events from transaction receipt
   * @param receipt - Transaction receipt
   * @param eventName - Event name to filter
   * @returns Array of events
   */
  static getEventsFromReceipt(receipt: any, eventName?: string) {
    if (!receipt.logs) return [];

    return receipt.logs.filter((log: any) => {
      if (!eventName) return true;
      return log.topics && log.topics[0] && log.fragment?.name === eventName;
    });
  }

  /**
   * Parse event arguments
   * @param event - Event object
   * @returns Parsed arguments
   */
  static parseEventArgs(event: any) {
    if (!event.args) return {};

    const parsed: any = {};

    for (let i = 0; i < event.args.length; i++) {
      const arg = event.args[i];
      parsed[i] = arg;

      if (event.fragment?.inputs[i]?.name) {
        parsed[event.fragment.inputs[i].name] = arg;
      }
    }

    return parsed;
  }
}

/**
 * Debug and logging helpers
 */
export class DebugHelpers {
  /**
   * Log contract state
   * @param contract - Contract instance
   * @param title - Log title
   */
  static async logContractState(contract: any, title: string = "Contract State") {
    console.log(`\n=== ${title} ===`);

    try {
      const tokenInfo = await contract.getTokenInfo();
      console.log(`Name: ${tokenInfo.name}`);
      console.log(`Symbol: ${tokenInfo.symbol}`);
      console.log(`Total Supply: ${formatTokenAmount(tokenInfo.totalSupply)}`);
      console.log(`Owner: ${tokenInfo.owner}`);
      console.log(`Paused: ${tokenInfo.paused}`);
    } catch (error) {
      console.log("Error getting contract state:", error);
    }

    console.log("==================\n");
  }

  /**
   * Log gas usage
   * @param receipt - Transaction receipt
   * @param description - Description of transaction
   */
  static logGasUsage(receipt: any, description: string = "Transaction") {
    if (receipt.gasUsed) {
      console.log(`${description} Gas Used: ${receipt.gasUsed.toString()}`);
    }
  }
}

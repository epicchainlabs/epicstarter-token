// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IBurnable
 * @dev Interface for burnable token functionality
 * @author EpicChain Labs
 */
interface IBurnable {

    // Events
    event Burn(address indexed from, uint256 value);
    event BurnFrom(address indexed from, address indexed burner, uint256 value);

    // Errors
    error BurnExceedsBalance();
    error BurnExceedsAllowance();
    error BurnFromZeroAddress();
    error BurnZeroAmount();

    /**
     * @dev Burns a specific amount of tokens from the caller's account
     * @param amount The amount of tokens to burn
     *
     * Requirements:
     * - `amount` cannot be zero
     * - caller must have at least `amount` tokens
     *
     * Emits a {Burn} event.
     */
    function burn(uint256 amount) external;

    /**
     * @dev Burns a specific amount of tokens from a target account
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     *
     * Requirements:
     * - `account` cannot be the zero address
     * - `amount` cannot be zero
     * - caller must have allowance for at least `amount` tokens from `account`
     * - `account` must have at least `amount` tokens
     *
     * Emits a {BurnFrom} event.
     */
    function burnFrom(address account, uint256 amount) external;

    /**
     * @dev Returns the total amount of tokens burned
     * @return The total burned token amount
     */
    function totalBurned() external view returns (uint256);

    /**
     * @dev Returns the maximum total supply before any burns
     * @return The maximum supply amount
     */
    function maxSupply() external view returns (uint256);

    /**
     * @dev Returns the current circulating supply (total supply - burned tokens)
     * @return The circulating supply amount
     */
    function circulatingSupply() external view returns (uint256);
}

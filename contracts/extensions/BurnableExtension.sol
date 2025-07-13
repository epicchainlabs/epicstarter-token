// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IBurnable.sol";

/**
 * @title BurnableExtension
 * @dev Extension contract that adds burning functionality to ERC20 tokens
 * @author EpicChain Labs
 */
abstract contract BurnableExtension is ERC20, Ownable, ReentrancyGuard, IBurnable {

    // State variables
    uint256 private _totalBurned;
    uint256 private _maxSupply;

    // Mapping to track burned amounts per address
    mapping(address => uint256) private _burnedBalances;

    /**
     * @dev Constructor sets the maximum supply
     * @param maxSupply_ The maximum supply of tokens
     */
    constructor(uint256 maxSupply_) {
        _maxSupply = maxSupply_;
    }

    /**
     * @dev Burns a specific amount of tokens from the caller's account
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) external override nonReentrant {
        if (amount == 0) revert BurnZeroAmount();

        address account = _msgSender();
        uint256 accountBalance = balanceOf(account);

        if (accountBalance < amount) revert BurnExceedsBalance();

        _burn(account, amount);

        // Update burned tracking
        _totalBurned += amount;
        _burnedBalances[account] += amount;

        emit Burn(account, amount);
    }

    /**
     * @dev Burns a specific amount of tokens from a target account
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) external override nonReentrant {
        if (account == address(0)) revert BurnFromZeroAddress();
        if (amount == 0) revert BurnZeroAmount();

        address spender = _msgSender();
        uint256 currentAllowance = allowance(account, spender);

        if (currentAllowance < amount) revert BurnExceedsAllowance();

        uint256 accountBalance = balanceOf(account);
        if (accountBalance < amount) revert BurnExceedsBalance();

        _spendAllowance(account, spender, amount);
        _burn(account, amount);

        // Update burned tracking
        _totalBurned += amount;
        _burnedBalances[account] += amount;

        emit BurnFrom(account, spender, amount);
    }

    /**
     * @dev Returns the total amount of tokens burned
     * @return The total burned token amount
     */
    function totalBurned() external view override returns (uint256) {
        return _totalBurned;
    }

    /**
     * @dev Returns the maximum total supply before any burns
     * @return The maximum supply amount
     */
    function maxSupply() external view override returns (uint256) {
        return _maxSupply;
    }

    /**
     * @dev Returns the current circulating supply (total supply - burned tokens)
     * @return The circulating supply amount
     */
    function circulatingSupply() external view override returns (uint256) {
        return totalSupply();
    }

    /**
     * @dev Returns the amount of tokens burned by a specific account
     * @param account The account to check
     * @return The amount of tokens burned by the account
     */
    function burnedBalanceOf(address account) external view returns (uint256) {
        return _burnedBalances[account];
    }

    /**
     * @dev Returns the burn rate (percentage of total supply burned)
     * @return The burn rate as a percentage (multiplied by 100)
     */
    function burnRate() external view returns (uint256) {
        if (_maxSupply == 0) return 0;
        return (_totalBurned * 10000) / _maxSupply; // Returns percentage * 100
    }

    /**
     * @dev Internal function to handle burning logic
     * @param account The account to burn from
     * @param amount The amount to burn
     */
    function _burnTokens(address account, uint256 amount) internal {
        if (amount == 0) revert BurnZeroAmount();

        _burn(account, amount);
        _totalBurned += amount;
        _burnedBalances[account] += amount;
    }

    /**
     * @dev Emergency burn function - only owner can call
     * @param account The account to burn from
     * @param amount The amount to burn
     */
    function emergencyBurn(address account, uint256 amount) external onlyOwner nonReentrant {
        if (account == address(0)) revert BurnFromZeroAddress();
        if (amount == 0) revert BurnZeroAmount();

        uint256 accountBalance = balanceOf(account);
        if (accountBalance < amount) revert BurnExceedsBalance();

        _burnTokens(account, amount);

        emit Burn(account, amount);
    }

    /**
     * @dev Batch burn function for multiple accounts
     * @param accounts Array of accounts to burn from
     * @param amounts Array of amounts to burn
     */
    function batchBurn(address[] calldata accounts, uint256[] calldata amounts) external onlyOwner nonReentrant {
        if (accounts.length != amounts.length) revert("Arrays length mismatch");

        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == address(0)) revert BurnFromZeroAddress();
            if (amounts[i] == 0) continue;

            uint256 accountBalance = balanceOf(accounts[i]);
            if (accountBalance >= amounts[i]) {
                _burnTokens(accounts[i], amounts[i]);
                emit Burn(accounts[i], amounts[i]);
            }
        }
    }

    /**
     * @dev Returns true if the account has burned any tokens
     * @param account The account to check
     * @return True if the account has burned tokens
     */
    function hasBurned(address account) external view returns (bool) {
        return _burnedBalances[account] > 0;
    }
}

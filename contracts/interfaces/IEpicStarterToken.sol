// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

/**
 * @title IEpicStarterToken
 * @dev Interface for EpicStarter Token (EPCS) with extended functionality
 * @author EpicChain Labs
 */
interface IEpicStarterToken is IERC20, IAccessControl {

    // Events
    event TokensBurned(address indexed from, uint256 amount);
    event TokensPaused(address indexed account);
    event TokensUnpaused(address indexed account);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Errors
    error TokenTransferPaused();
    error TokenBurnExceedsBalance();
    error TokenInsufficientAllowance();
    error TokenZeroAddress();
    error TokenZeroAmount();
    error TokenNotOwner();
    error TokenAlreadyPaused();
    error TokenNotPaused();

    /**
     * @dev Returns the name of the token
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the number of decimals used to get its user representation
     */
    function decimals() external view returns (uint8);

    /**
     * @dev Returns the owner of the contract
     */
    function owner() external view returns (address);

    /**
     * @dev Returns true if the contract is paused, false otherwise
     */
    function paused() external view returns (bool);

    /**
     * @dev Burns a specific amount of tokens from the caller's account
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) external;

    /**
     * @dev Burns a specific amount of tokens from a specific account
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) external;

    /**
     * @dev Pauses all token transfers
     * Can only be called by the owner
     */
    function pause() external;

    /**
     * @dev Unpauses all token transfers
     * Can only be called by the owner
     */
    function unpause() external;

    /**
     * @dev Transfers ownership of the contract to a new account
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) external;

    /**
     * @dev Renounces ownership of the contract
     */
    function renounceOwnership() external;

    /**
     * @dev Emergency function to withdraw any ERC20 token from the contract
     * @param token The address of the token to withdraw
     * @param to The address to send the tokens to
     * @param amount The amount of tokens to withdraw
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external;

    /**
     * @dev Returns the maximum supply of the token
     */
    function maxSupply() external view returns (uint256);

    /**
     * @dev Returns the current circulating supply (total supply - burned tokens)
     */
    function circulatingSupply() external view returns (uint256);

    /**
     * @dev Returns the total amount of tokens burned
     */
    function totalBurned() external view returns (uint256);

    /**
     * @dev Checks if an account has a specific role
     * @param role The role to check
     * @param account The account to check
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Grants a role to an account
     * @param role The role to grant
     * @param account The account to grant the role to
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes a role from an account
     * @param role The role to revoke
     * @param account The account to revoke the role from
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Returns the admin role for a given role
     * @param role The role to get the admin for
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPausable
 * @dev Interface for pausable token functionality
 * @author EpicChain Labs
 */
interface IPausable {

    // Events
    event Paused(address account);
    event Unpaused(address account);

    // Errors
    error TokenPaused();
    error TokenNotPaused();
    error TokenAlreadyPaused();
    error TokenPauseNotAuthorized();

    /**
     * @dev Returns true if the contract is paused, and false otherwise
     * @return True if paused, false otherwise
     */
    function paused() external view returns (bool);

    /**
     * @dev Triggers stopped state
     *
     * Requirements:
     * - The contract must not be paused
     * - Only authorized accounts can pause
     *
     * Emits a {Paused} event.
     */
    function pause() external;

    /**
     * @dev Returns to normal state
     *
     * Requirements:
     * - The contract must be paused
     * - Only authorized accounts can unpause
     *
     * Emits an {Unpaused} event.
     */
    function unpause() external;

    /**
     * @dev Modifier to make a function callable only when the contract is not paused
     * This is used internally by the contract implementation
     */
    function whenNotPaused() external view;

    /**
     * @dev Modifier to make a function callable only when the contract is paused
     * This is used internally by the contract implementation
     */
    function whenPaused() external view;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IPausable.sol";

/**
 * @title PausableExtension
 * @dev Extension contract that adds pausing functionality to ERC20 tokens
 * @author EpicChain Labs
 */
abstract contract PausableExtension is ERC20, Ownable, ReentrancyGuard, IPausable {

    // State variables
    bool private _paused;

    // Mapping to track pause timestamps
    mapping(uint256 => uint256) private _pauseHistory;
    uint256 private _pauseCount;

    // Emergency pause flag
    bool private _emergencyPaused;

    /**
     * @dev Modifier to make a function callable only when the contract is not paused
     */
    modifier whenNotPaused() {
        if (_paused) revert TokenPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused
     */
    modifier whenPaused() {
        if (!_paused) revert TokenNotPaused();
        _;
    }

    /**
     * @dev Constructor initializes the contract as not paused
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise
     * @return True if paused, false otherwise
     */
    function paused() public view override returns (bool) {
        return _paused || _emergencyPaused;
    }

    /**
     * @dev Triggers stopped state
     * Requirements:
     * - The contract must not be paused
     * - Only owner can pause
     */
    function pause() external override onlyOwner {
        if (_paused) revert TokenAlreadyPaused();

        _paused = true;
        _pauseHistory[_pauseCount] = block.timestamp;
        _pauseCount++;

        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state
     * Requirements:
     * - The contract must be paused
     * - Only owner can unpause
     */
    function unpause() external override onlyOwner {
        if (!_paused) revert TokenNotPaused();

        _paused = false;
        _emergencyPaused = false; // Clear emergency pause as well

        emit Unpaused(_msgSender());
    }

    /**
     * @dev Emergency pause function - can be called by owner even if already paused
     */
    function emergencyPause() external onlyOwner {
        _emergencyPaused = true;
        if (!_paused) {
            _paused = true;
            _pauseHistory[_pauseCount] = block.timestamp;
            _pauseCount++;
        }

        emit Paused(_msgSender());
    }

    /**
     * @dev Returns the number of times the contract has been paused
     * @return The pause count
     */
    function getPauseCount() external view returns (uint256) {
        return _pauseCount;
    }

    /**
     * @dev Returns the timestamp of a specific pause event
     * @param index The index of the pause event
     * @return The timestamp of the pause event
     */
    function getPauseTimestamp(uint256 index) external view returns (uint256) {
        require(index < _pauseCount, "Invalid pause index");
        return _pauseHistory[index];
    }

    /**
     * @dev Returns true if the contract is in emergency pause mode
     * @return True if emergency paused, false otherwise
     */
    function isEmergencyPaused() external view returns (bool) {
        return _emergencyPaused;
    }

    /**
     * @dev Internal function to check if transfers are allowed
     * This should be called by _beforeTokenTransfer
     */
    function _checkPauseState() internal view {
        if (_paused || _emergencyPaused) revert TokenPaused();
    }

    /**
     * @dev Override _beforeTokenTransfer to add pause functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        // Allow minting even when paused (from == address(0))
        // Allow burning even when paused (to == address(0))
        if (from != address(0) && to != address(0)) {
            _checkPauseState();
        }
    }

    /**
     * @dev Batch pause check for multiple operations
     * @param operations Array of operation types (0=transfer, 1=mint, 2=burn)
     * @return Array of booleans indicating if each operation is allowed
     */
    function checkBatchOperations(uint8[] calldata operations) external view returns (bool[] memory) {
        bool[] memory results = new bool[](operations.length);
        bool isPaused = paused();

        for (uint256 i = 0; i < operations.length; i++) {
            if (operations[i] == 0) { // transfer
                results[i] = !isPaused;
            } else if (operations[i] == 1) { // mint
                results[i] = true; // minting allowed even when paused
            } else if (operations[i] == 2) { // burn
                results[i] = true; // burning allowed even when paused
            } else {
                results[i] = false; // unknown operation
            }
        }

        return results;
    }

    /**
     * @dev Function to check if a specific address can perform transfers
     * @param account The address to check
     * @return True if the address can transfer, false otherwise
     */
    function canTransfer(address account) external view returns (bool) {
        return !paused() && account != address(0);
    }

    /**
     * @dev Returns detailed pause information
     * @return isPaused Current pause state
     * @return isEmergency Current emergency pause state
     * @return pauseCount Total number of pauses
     * @return lastPauseTime Timestamp of the last pause
     */
    function getPauseInfo() external view returns (
        bool isPaused,
        bool isEmergency,
        uint256 pauseCount,
        uint256 lastPauseTime
    ) {
        isPaused = _paused;
        isEmergency = _emergencyPaused;
        pauseCount = _pauseCount;
        lastPauseTime = _pauseCount > 0 ? _pauseHistory[_pauseCount - 1] : 0;
    }

    /**
     * @dev Implementation of IPausable.whenNotPaused for external use
     */
    function whenNotPaused() external view override {
        if (_paused || _emergencyPaused) revert TokenPaused();
    }

    /**
     * @dev Implementation of IPausable.whenPaused for external use
     */
    function whenPaused() external view override {
        if (!_paused && !_emergencyPaused) revert TokenNotPaused();
    }
}

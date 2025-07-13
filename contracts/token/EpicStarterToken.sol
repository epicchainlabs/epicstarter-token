// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IEpicStarterToken.sol";
import "../extensions/BurnableExtension.sol";
import "../extensions/PausableExtension.sol";

/**
 * @title EpicStarterToken
 * @dev BEP20 token implementation for EpicStarter (EPCS) presale
 * @author EpicChain Labs
 *
 * Features:
 * - Fixed supply of 100,000,000 tokens
 * - Burnable functionality for token swaps
 * - Pausable transfers for emergency control
 * - Ownable with access control
 * - Reentrancy protection
 * - Emergency withdrawal capabilities
 * - Comprehensive event logging
 */
contract EpicStarterToken is
    ERC20,
    Ownable,
    AccessControl,
    ReentrancyGuard,
    BurnableExtension,
    PausableExtension,
    IEpicStarterToken
{
    // Constants
    string private constant TOKEN_NAME = "EpicStarter";
    string private constant TOKEN_SYMBOL = "EPCS";
    uint8 private constant TOKEN_DECIMALS = 18;
    uint256 private constant TOTAL_SUPPLY = 100_000_000 * 10**TOKEN_DECIMALS;

    // Roles
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // State variables
    uint256 private _initialSupply;
    bool private _initialized;

    // Events
    event TokensInitialized(address indexed owner, uint256 totalSupply);
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    // Errors
    error TokenAlreadyInitialized();
    error TokenNotInitialized();
    error TokenInvalidAmount();
    error TokenInvalidAddress();
    error TokenUnauthorized();
    error TokenTransferFailed();

    /**
     * @dev Constructor initializes the token with basic parameters
     * @param initialOwner The address that will own the contract
     */
    constructor(address initialOwner)
        ERC20(TOKEN_NAME, TOKEN_SYMBOL)
        BurnableExtension(TOTAL_SUPPLY)
        PausableExtension()
    {
        if (initialOwner == address(0)) revert TokenInvalidAddress();

        _transferOwnership(initialOwner);
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(PAUSER_ROLE, initialOwner);
        _grantRole(BURNER_ROLE, initialOwner);
        _grantRole(EMERGENCY_ROLE, initialOwner);

        _initialSupply = TOTAL_SUPPLY;
        _mint(initialOwner, TOTAL_SUPPLY);
        _initialized = true;

        emit TokensInitialized(initialOwner, TOTAL_SUPPLY);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation
     */
    function decimals() public pure override returns (uint8) {
        return TOKEN_DECIMALS;
    }

    /**
     * @dev Returns the maximum supply of the token
     */
    function maxSupply() external view override returns (uint256) {
        return TOTAL_SUPPLY;
    }

    /**
     * @dev Returns the initial supply at deployment
     */
    function initialSupply() external view returns (uint256) {
        return _initialSupply;
    }

    /**
     * @dev Returns true if the token has been initialized
     */
    function initialized() external view returns (bool) {
        return _initialized;
    }

    /**
     * @dev Burns tokens from the caller's account
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) external override nonReentrant {
        if (amount == 0) revert TokenInvalidAmount();

        address account = _msgSender();
        uint256 accountBalance = balanceOf(account);

        if (accountBalance < amount) revert BurnExceedsBalance();

        _burn(account, amount);

        emit TokensBurned(account, amount);
    }

    /**
     * @dev Burns tokens from a specific account with allowance
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) external override nonReentrant {
        if (account == address(0)) revert TokenInvalidAddress();
        if (amount == 0) revert TokenInvalidAmount();

        address spender = _msgSender();
        uint256 currentAllowance = allowance(account, spender);

        if (currentAllowance < amount) revert BurnExceedsAllowance();

        _spendAllowance(account, spender, amount);
        _burn(account, amount);

        emit TokensBurned(account, amount);
    }

    /**
     * @dev Pauses all token transfers
     */
    function pause() external override onlyRole(PAUSER_ROLE) {
        _pause();
        emit TokensPaused(_msgSender());
    }

    /**
     * @dev Unpauses all token transfers
     */
    function unpause() external override onlyRole(PAUSER_ROLE) {
        _unpause();
        emit TokensUnpaused(_msgSender());
    }

    /**
     * @dev Emergency pause function
     */
    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
        emit TokensPaused(_msgSender());
    }

    /**
     * @dev Transfers ownership of the contract
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) public override onlyOwner {
        if (newOwner == address(0)) revert TokenInvalidAddress();

        address oldOwner = owner();
        _transferOwnership(newOwner);

        // Transfer admin roles to new owner
        _grantRole(DEFAULT_ADMIN_ROLE, newOwner);
        _grantRole(PAUSER_ROLE, newOwner);
        _grantRole(BURNER_ROLE, newOwner);
        _grantRole(EMERGENCY_ROLE, newOwner);

        // Revoke roles from old owner
        _revokeRole(DEFAULT_ADMIN_ROLE, oldOwner);
        _revokeRole(PAUSER_ROLE, oldOwner);
        _revokeRole(BURNER_ROLE, oldOwner);
        _revokeRole(EMERGENCY_ROLE, oldOwner);

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @dev Emergency function to withdraw any ERC20 token from the contract
     * @param token The address of the token to withdraw
     * @param to The address to send the tokens to
     * @param amount The amount of tokens to withdraw
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external override onlyRole(EMERGENCY_ROLE) nonReentrant {
        if (token == address(0)) revert TokenInvalidAddress();
        if (to == address(0)) revert TokenInvalidAddress();
        if (amount == 0) revert TokenInvalidAmount();

        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));

        if (balance < amount) revert TokenInvalidAmount();

        bool success = tokenContract.transfer(to, amount);
        if (!success) revert TokenTransferFailed();

        emit EmergencyWithdraw(token, to, amount);
    }

    /**
     * @dev Emergency function to withdraw BNB from the contract
     * @param to The address to send BNB to
     * @param amount The amount of BNB to withdraw
     */
    function emergencyWithdrawBNB(
        address payable to,
        uint256 amount
    ) external onlyRole(EMERGENCY_ROLE) nonReentrant {
        if (to == address(0)) revert TokenInvalidAddress();
        if (amount == 0) revert TokenInvalidAmount();
        if (address(this).balance < amount) revert TokenInvalidAmount();

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TokenTransferFailed();

        emit EmergencyWithdraw(address(0), to, amount);
    }

    /**
     * @dev Batch transfer function for multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to transfer
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external nonReentrant {
        if (recipients.length != amounts.length) revert("Arrays length mismatch");
        if (recipients.length == 0) revert TokenInvalidAmount();

        address sender = _msgSender();
        uint256 totalAmount = 0;

        // Calculate total amount needed
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        if (balanceOf(sender) < totalAmount) revert("Insufficient balance");

        // Perform transfers
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert TokenInvalidAddress();
            if (amounts[i] == 0) continue;

            _transfer(sender, recipients[i], amounts[i]);
        }
    }

    /**
     * @dev Override _beforeTokenTransfer to add pause functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20, PausableExtension) {
        super._beforeTokenTransfer(from, to, amount);
        PausableExtension._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev Override supportsInterface to support AccessControl
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns token information in a single call
     */
    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        uint256 maxSupply,
        uint256 totalBurned,
        uint256 circulatingSupply,
        bool paused,
        address owner
    ) {
        name = TOKEN_NAME;
        symbol = TOKEN_SYMBOL;
        decimals = TOKEN_DECIMALS;
        totalSupply = super.totalSupply();
        maxSupply = TOTAL_SUPPLY;
        totalBurned = super.totalBurned();
        circulatingSupply = super.circulatingSupply();
        paused = super.paused();
        owner = super.owner();
    }

    /**
     * @dev Returns comprehensive contract status
     */
    function getContractStatus() external view returns (
        bool initialized,
        bool paused,
        bool emergencyPaused,
        uint256 pauseCount,
        uint256 totalHolders,
        uint256 burnRate
    ) {
        initialized = _initialized;
        paused = super.paused();
        emergencyPaused = super.isEmergencyPaused();
        pauseCount = super.getPauseCount();
        totalHolders = 0; // Would need additional tracking for accurate count
        burnRate = super.burnRate();
    }

    /**
     * @dev Fallback function to receive BNB
     */
    receive() external payable {
        // Contract can receive BNB for emergency purposes
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("Function not found");
    }
}

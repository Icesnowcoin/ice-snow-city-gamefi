// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title GameCoin (GC)
 * @dev ERC20 token for Ice Snow City game economy
 * 
 * Features:
 * - Standard ERC20 token with 18 decimals
 * - Burnable tokens
 * - Snapshot capability for historical tracking
 * - Permit functionality for gasless approvals
 * - Owner-controlled minting and burning
 */
contract GameCoin is ERC20, ERC20Burnable, ERC20Snapshot, Ownable, ERC20Permit {
    // Maximum supply: 1 billion tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    // Minting events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event SnapshotCreated(uint256 indexed snapshotId);

    // Snapshot counter
    uint256 private _snapshotCounter;

    /**
     * @dev Constructor initializes the token
     * @param initialSupply Initial token supply (in whole tokens, not wei)
     */
    constructor(uint256 initialSupply) ERC20("GameCoin", "GC") ERC20Permit("GameCoin") {
        require(initialSupply * 10 ** 18 <= MAX_SUPPLY, "Initial supply exceeds max supply");
        _mint(msg.sender, initialSupply * 10 ** 18);
    }

    /**
     * @dev Mint new tokens (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in wei)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Minting would exceed max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount of tokens to burn (in wei)
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from specific address (only owner)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn (in wei)
     */
    function burnFrom(address from, uint256 amount) public override onlyOwner {
        super.burnFrom(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @dev Create a snapshot of current token balances
     * @return Snapshot ID
     */
    function snapshot() public onlyOwner returns (uint256) {
        _snapshotCounter++;
        _snapshot();
        emit SnapshotCreated(_snapshotCounter);
        return _snapshotCounter;
    }

    /**
     * @dev Get balance at specific snapshot
     * @param account Address to check balance for
     * @param snapshotId Snapshot ID
     * @return Balance at snapshot
     */
    function balanceOfAt(address account, uint256 snapshotId) public view returns (uint256) {
        return super.balanceOfAt(account, snapshotId);
    }

    /**
     * @dev Get total supply at specific snapshot
     * @param snapshotId Snapshot ID
     * @return Total supply at snapshot
     */
    function totalSupplyAt(uint256 snapshotId) public view returns (uint256) {
        return super.totalSupplyAt(snapshotId);
    }

    /**
     * @dev Get current snapshot counter
     * @return Current snapshot ID
     */
    function getCurrentSnapshotId() public view returns (uint256) {
        return _snapshotCounter;
    }

    // Internal functions to handle ERC20 extensions

    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Snapshot)
    {
        super._update(from, to, amount);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, ERC20)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title ÆRA Token
 * @dev ERC-20 Token mit erweiterten Funktionen
 * - Pausierbar: Token-Transfers können pausiert werden
 * - Burnable: Token können verbrannt werden
 * - Permit: Gaslose Genehmigungen möglich
 * - Ownable: Nur Owner kann bestimmte Funktionen ausführen
 */
contract AeraToken is ERC20, ERC20Burnable, Pausable, Ownable, ERC20Permit {
    
    // Maximum Supply: 1 Milliarde Token
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    /**
     * @dev Constructor
     * @param initialSupply Initiale Token-Menge (in ganzen Token, nicht Wei)
     * @param initialOwner Adresse des initialen Besitzers
     */
    constructor(
        uint256 initialSupply,
        address initialOwner
    ) 
        ERC20("AEra Token", "AERA") 
        ERC20Permit("AEra Token")
        Ownable(initialOwner)
    {
        require(initialSupply > 0, "Initial supply must be greater than 0");
        require(initialSupply <= MAX_SUPPLY / 10**18, "Initial supply exceeds maximum supply");
        require(initialOwner != address(0), "Initial owner cannot be zero address");
        
        uint256 initialSupplyWei = initialSupply * 10**18;
        _mint(initialOwner, initialSupplyWei);
        
        emit TokensMinted(initialOwner, initialSupplyWei);
    }
    
    /**
     * @dev Mint neue Token (nur Owner)
     * @param to Empfänger-Adresse
     * @param amount Anzahl Token (in Wei)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Minting would exceed max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Pausiert alle Token-Transfers (nur Owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Hebt die Pausierung auf (nur Owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Überschreibt _update um Pausierung zu unterstützen
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }
    
    /**
     * @dev Überschreibt burn um Event zu emittieren
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(_msgSender(), amount);
    }
    
    /**
     * @dev Überschreibt burnFrom um Event zu emittieren
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }
    
    /**
     * @dev Gibt die Anzahl der Dezimalstellen zurück (18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
    
    /**
     * @dev Emergency-Funktion: Zieht versehentlich gesendete ERC-20 Token ab
     * @param token Adresse des ERC-20 Token-Contracts
     * @param amount Anzahl der abzuziehenden Token
     */
    function emergencyTokenWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(this), "Cannot withdraw own tokens");
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @dev Emergency-Funktion: Zieht versehentlich gesendete ETH ab
     */
    function emergencyEthWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
    }
}
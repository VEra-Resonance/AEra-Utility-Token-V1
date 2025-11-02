const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AeraToken", function () {
    let AeraToken, aeraToken;
    let owner, addr1, addr2, addr3;
    const INITIAL_SUPPLY = 100_000_000; // 100 Million Token
    const MAX_SUPPLY = ethers.parseEther("1000000000"); // 1 Milliarde Token
    
    beforeEach(async function () {
        // Signers abrufen
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        
        // Contract deployen
        AeraToken = await ethers.getContractFactory("AeraToken");
        aeraToken = await AeraToken.deploy(INITIAL_SUPPLY, owner.address);
        await aeraToken.deployed();
    });
    
    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await aeraToken.name()).to.equal("AEra Token");
            expect(await aeraToken.symbol()).to.equal("AERA");
        });
        
        it("Should set the correct decimals", async function () {
            expect(await aeraToken.decimals()).to.equal(18);
        });
        
        it("Should set the correct owner", async function () {
            expect(await aeraToken.owner()).to.equal(owner.address);
        });
        
        it("Should mint initial supply to owner", async function () {
            const expectedSupply = ethers.parseEther(INITIAL_SUPPLY.toString());
            expect(await aeraToken.totalSupply()).to.equal(expectedSupply);
            expect(await aeraToken.balanceOf(owner.address)).to.equal(expectedSupply);
        });
        
        it("Should not be paused initially", async function () {
            expect(await aeraToken.paused()).to.be.false;
        });
        
        it("Should revert if initial supply is zero", async function () {
            await expect(
                AeraToken.deploy(0, owner.address)
            ).to.be.revertedWith("Initial supply must be greater than 0");
        });
        
        it("Should revert if initial owner is zero address", async function () {
            await expect(
                AeraToken.deploy(INITIAL_SUPPLY, ethers.ZeroAddress)
            ).to.be.revertedWith("Initial owner cannot be zero address");
        });
        
        it("Should revert if initial supply exceeds max supply", async function () {
            await expect(
                AeraToken.deploy(2_000_000_000, owner.address) // 2 Milliarden > 1 Milliarde Max
            ).to.be.revertedWith("Initial supply exceeds maximum supply");
        });
    });
    
    describe("Basic ERC20 Functionality", function () {
        it("Should transfer tokens between accounts", async function () {
            const amount = ethers.utils.parseEther("1000");
            
            await aeraToken.transfer(addr1.address, amount);
            expect(await aeraToken.balanceOf(addr1.address)).to.equal(amount);
            
            const ownerBalance = await aeraToken.balanceOf(owner.address);
            const expectedOwnerBalance = ethers.utils.parseEther(INITIAL_SUPPLY.toString()).sub(amount);
            expect(ownerBalance).to.equal(expectedOwnerBalance);
        });
        
        it("Should fail if sender doesn't have enough tokens", async function () {
            const amount = ethers.utils.parseEther("1");
            await expect(
                aeraToken.connect(addr1).transfer(addr2.address, amount)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
        
        it("Should approve and allow transferFrom", async function () {
            const amount = ethers.utils.parseEther("1000");
            
            // Owner transferiert erst Token zu addr1
            await aeraToken.transfer(addr1.address, amount);
            
            // addr1 approved addr2
            await aeraToken.connect(addr1).approve(addr2.address, amount);
            expect(await aeraToken.allowance(addr1.address, addr2.address)).to.equal(amount);
            
            // addr2 transferiert von addr1 zu addr3
            await aeraToken.connect(addr2).transferFrom(addr1.address, addr3.address, amount);
            expect(await aeraToken.balanceOf(addr3.address)).to.equal(amount);
            expect(await aeraToken.balanceOf(addr1.address)).to.equal(0);
        });
    });
    
    describe("Minting", function () {
        it("Should allow owner to mint tokens", async function () {
            const mintAmount = ethers.utils.parseEther("1000");
            const initialSupply = await aeraToken.totalSupply();
            
            await expect(aeraToken.mint(addr1.address, mintAmount))
                .to.emit(aeraToken, "TokensMinted")
                .withArgs(addr1.address, mintAmount);
            
            expect(await aeraToken.balanceOf(addr1.address)).to.equal(mintAmount);
            expect(await aeraToken.totalSupply()).to.equal(initialSupply.add(mintAmount));
        });
        
        it("Should not allow non-owner to mint", async function () {
            const mintAmount = ethers.utils.parseEther("1000");
            
            await expect(
                aeraToken.connect(addr1).mint(addr2.address, mintAmount)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        
        it("Should not mint to zero address", async function () {
            const mintAmount = ethers.utils.parseEther("1000");
            
            await expect(
                aeraToken.mint(ethers.constants.AddressZero, mintAmount)
            ).to.be.revertedWith("Cannot mint to zero address");
        });
        
        it("Should not exceed max supply when minting", async function () {
            const currentSupply = await aeraToken.totalSupply();
            const excessAmount = MAX_SUPPLY.sub(currentSupply).add(1);
            
            await expect(
                aeraToken.mint(addr1.address, excessAmount)
            ).to.be.revertedWith("Minting would exceed max supply");
        });
    });
    
    describe("Burning", function () {
        beforeEach(async function () {
            // Transfer some tokens to addr1 for burning tests
            await aeraToken.transfer(addr1.address, ethers.utils.parseEther("10000"));
        });
        
        it("Should allow token holders to burn their tokens", async function () {
            const burnAmount = ethers.utils.parseEther("1000");
            const initialBalance = await aeraToken.balanceOf(addr1.address);
            const initialSupply = await aeraToken.totalSupply();
            
            await expect(aeraToken.connect(addr1).burn(burnAmount))
                .to.emit(aeraToken, "TokensBurned")
                .withArgs(addr1.address, burnAmount);
            
            expect(await aeraToken.balanceOf(addr1.address)).to.equal(initialBalance.sub(burnAmount));
            expect(await aeraToken.totalSupply()).to.equal(initialSupply.sub(burnAmount));
        });
        
        it("Should allow approved accounts to burn tokens via burnFrom", async function () {
            const burnAmount = ethers.utils.parseEther("1000");
            const initialBalance = await aeraToken.balanceOf(addr1.address);
            const initialSupply = await aeraToken.totalSupply();
            
            // addr1 approved addr2 to burn tokens
            await aeraToken.connect(addr1).approve(addr2.address, burnAmount);
            
            await expect(aeraToken.connect(addr2).burnFrom(addr1.address, burnAmount))
                .to.emit(aeraToken, "TokensBurned")
                .withArgs(addr1.address, burnAmount);
            
            expect(await aeraToken.balanceOf(addr1.address)).to.equal(initialBalance.sub(burnAmount));
            expect(await aeraToken.totalSupply()).to.equal(initialSupply.sub(burnAmount));
        });
    });
    
    describe("Pausable Functionality", function () {
        it("Should allow owner to pause and unpause", async function () {
            await aeraToken.pause();
            expect(await aeraToken.paused()).to.be.true;
            
            await aeraToken.unpause();
            expect(await aeraToken.paused()).to.be.false;
        });
        
        it("Should not allow non-owner to pause", async function () {
            await expect(
                aeraToken.connect(addr1).pause()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        
        it("Should prevent transfers when paused", async function () {
            await aeraToken.pause();
            
            await expect(
                aeraToken.transfer(addr1.address, ethers.utils.parseEther("1000"))
            ).to.be.revertedWith("Pausable: paused");
        });
        
        it("Should allow transfers when unpaused", async function () {
            await aeraToken.pause();
            await aeraToken.unpause();
            
            const amount = ethers.utils.parseEther("1000");
            await aeraToken.transfer(addr1.address, amount);
            expect(await aeraToken.balanceOf(addr1.address)).to.equal(amount);
        });
    });
    
    describe("Emergency Functions", function () {
        it("Should allow owner to withdraw accidentally sent ETH", async function () {
            // Simulate ETH being sent to contract
            await owner.sendTransaction({
                to: aeraToken.address,
                value: ethers.utils.parseEther("1.0")
            });
            
            const initialOwnerBalance = await owner.getBalance();
            
            await aeraToken.emergencyEthWithdraw();
            
            expect(await ethers.provider.getBalance(aeraToken.address)).to.equal(0);
        });
        
        it("Should not allow withdrawal if no ETH balance", async function () {
            await expect(
                aeraToken.emergencyEthWithdraw()
            ).to.be.revertedWith("No ETH to withdraw");
        });
        
        it("Should not allow non-owner to withdraw ETH", async function () {
            await expect(
                aeraToken.connect(addr1).emergencyEthWithdraw()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        
        it("Should not allow withdrawal of own tokens", async function () {
            await expect(
                aeraToken.emergencyTokenWithdraw(aeraToken.address, 1000)
            ).to.be.revertedWith("Cannot withdraw own tokens");
        });
    });
    
    describe("ERC20Permit Functionality", function () {
        it("Should have correct domain separator", async function () {
            const domainSeparator = await aeraToken.DOMAIN_SEPARATOR();
            expect(domainSeparator).to.not.equal("0x");
        });
        
        it("Should track nonces correctly", async function () {
            expect(await aeraToken.nonces(owner.address)).to.equal(0);
        });
    });
    
    describe("Constants and View Functions", function () {
        it("Should return correct max supply", async function () {
            expect(await aeraToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
        });
        
        it("Should return correct decimals", async function () {
            expect(await aeraToken.decimals()).to.equal(18);
        });
    });
});
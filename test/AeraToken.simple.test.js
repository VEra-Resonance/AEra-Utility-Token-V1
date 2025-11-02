const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AeraToken", function () {
    let AeraToken, aeraToken;
    let owner, addr1, addr2;
    const INITIAL_SUPPLY = 100_000_000; // 100 Million Token
    
    beforeEach(async function () {
        // Signers abrufen
        [owner, addr1, addr2] = await ethers.getSigners();
        
        // Contract deployen
        AeraToken = await ethers.getContractFactory("AeraToken");
        aeraToken = await AeraToken.deploy(INITIAL_SUPPLY, owner.address);
        await aeraToken.waitForDeployment();
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
    });
    
    describe("Basic ERC20 Functionality", function () {
        it("Should transfer tokens between accounts", async function () {
            const amount = ethers.parseEther("1000");
            
            await aeraToken.transfer(addr1.address, amount);
            expect(await aeraToken.balanceOf(addr1.address)).to.equal(amount);
        });
        
        it("Should approve and allow transferFrom", async function () {
            const amount = ethers.parseEther("1000");
            
            // Owner transferiert erst Token zu addr1
            await aeraToken.transfer(addr1.address, amount);
            
            // addr1 approved addr2
            await aeraToken.connect(addr1).approve(addr2.address, amount);
            expect(await aeraToken.allowance(addr1.address, addr2.address)).to.equal(amount);
            
            // addr2 transferiert von addr1 zu owner
            await aeraToken.connect(addr2).transferFrom(addr1.address, owner.address, amount);
            expect(await aeraToken.balanceOf(addr1.address)).to.equal(0);
        });
    });
    
    describe("Minting", function () {
        it("Should allow owner to mint tokens", async function () {
            const mintAmount = ethers.parseEther("1000");
            const initialSupply = await aeraToken.totalSupply();
            
            await expect(aeraToken.mint(addr1.address, mintAmount))
                .to.emit(aeraToken, "TokensMinted")
                .withArgs(addr1.address, mintAmount);
            
            expect(await aeraToken.balanceOf(addr1.address)).to.equal(mintAmount);
            expect(await aeraToken.totalSupply()).to.equal(initialSupply + mintAmount);
        });
        
        it("Should not allow non-owner to mint", async function () {
            const mintAmount = ethers.parseEther("1000");
            
            await expect(
                aeraToken.connect(addr1).mint(addr2.address, mintAmount)
            ).to.be.revertedWithCustomError(aeraToken, "OwnableUnauthorizedAccount");
        });
    });
    
    describe("Burning", function () {
        beforeEach(async function () {
            // Transfer some tokens to addr1 for burning tests
            await aeraToken.transfer(addr1.address, ethers.parseEther("10000"));
        });
        
        it("Should allow token holders to burn their tokens", async function () {
            const burnAmount = ethers.parseEther("1000");
            const initialBalance = await aeraToken.balanceOf(addr1.address);
            const initialSupply = await aeraToken.totalSupply();
            
            await expect(aeraToken.connect(addr1).burn(burnAmount))
                .to.emit(aeraToken, "TokensBurned")
                .withArgs(addr1.address, burnAmount);
            
            expect(await aeraToken.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
            expect(await aeraToken.totalSupply()).to.equal(initialSupply - burnAmount);
        });
    });
    
    describe("Pausable Functionality", function () {
        it("Should allow owner to pause and unpause", async function () {
            await aeraToken.pause();
            expect(await aeraToken.paused()).to.be.true;
            
            await aeraToken.unpause();
            expect(await aeraToken.paused()).to.be.false;
        });
        
        it("Should prevent transfers when paused", async function () {
            await aeraToken.pause();
            
            await expect(
                aeraToken.transfer(addr1.address, ethers.parseEther("1000"))
            ).to.be.revertedWithCustomError(aeraToken, "EnforcedPause");
        });
        
        it("Should allow transfers when unpaused", async function () {
            await aeraToken.pause();
            await aeraToken.unpause();
            
            const amount = ethers.parseEther("1000");
            await aeraToken.transfer(addr1.address, amount);
            expect(await aeraToken.balanceOf(addr1.address)).to.equal(amount);
        });
    });
    
    describe("Constants", function () {
        it("Should return correct max supply", async function () {
            const maxSupply = ethers.parseEther("1000000000"); // 1 Milliarde
            expect(await aeraToken.MAX_SUPPLY()).to.equal(maxSupply);
        });
    });
});
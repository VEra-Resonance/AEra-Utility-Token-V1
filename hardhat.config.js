require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  networks: {
    // Lokales Hardhat Network
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 0x1fffffffffffff,
      allowUnlimitedContractSize: true,
      timeout: 1800000
    },
    
    // Localhost (für lokale Blockchain)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    
    // Ethereum Sepolia Testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gas: 6000000,
      gasPrice: 20000000000 // 20 gwei
    },
    
    // Ethereum Mainnet
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      gas: 6000000,
      gasPrice: 20000000000 // 20 gwei (anpassen je nach Netzwerkbedingungen)
    }
  },
  
  // Etherscan Verification
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || ""
    }
  },
  
  // Gas Reporter (für Tests)
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "EUR",
    gasPrice: 21,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  
  // Coverage
  solidity_coverage: {
    skipFiles: ["test/", "scripts/"]
  },
  
  // Mocha Timeout
  mocha: {
    timeout: 300000 // 5 minutes
  },
  
  // Paths
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
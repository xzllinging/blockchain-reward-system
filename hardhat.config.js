require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY     = process.env.PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",

  networks: {
    // 本地开发网络（内存模式，用于 hardhat test）
    hardhat: {
      chainId: 887766
    },

    // 本地持久节点（npx hardhat node → npx hardhat run --network localhost）
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 887766,
    },

    // Sepolia 测试网（从 .env 读取私钥和 RPC）
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111
    }
  },

  // 可选：Etherscan 合约验证
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  },

  paths: {
    artifacts: "./artifacts",
    cache:     "./cache",
    sources:   "./contracts",
    tests:     "./test"
  }
};

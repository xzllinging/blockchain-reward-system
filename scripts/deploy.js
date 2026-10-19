const hre = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const networkName = hre.network.name;
  console.log(`\n========== 部署 Reward 合约 ==========`);
  console.log(`网络: ${networkName}`);
  console.log(`部署账户: ${(await hre.ethers.getSigners())[0].address}\n`);

  // 1. 获取合约工厂
  const Reward = await hre.ethers.getContractFactory("Reward");
  console.log("合约工厂已加载");

  // 2. 部署（构造函数无参数）
  const reward = await Reward.deploy();
  await reward.waitForDeployment();

  const contractAddress = await reward.getAddress();
  console.log(`\n✅ Reward 合约部署成功！`);
  console.log(`   地址: ${contractAddress}`);
  console.log(`   交易 Hash: ${reward.deploymentTransaction().hash}`);

  // 3. 输出部署信息
  console.log(`\n========================================`);
  console.log(`📋 部署摘要`);
  console.log(`   网络:    ${networkName}`);
  console.log(`   合约:    Reward`);
  console.log(`   地址:    ${contractAddress}`);
  console.log(`   网络 ChainId: ${(await hre.ethers.provider.getNetwork()).chainId}`);
  console.log(`========================================\n`);

  // 4. 将合约地址写入前端配置文件（本地和 Sepolia 都自动更新）
  const frontendConfigPath = path.join(
    __dirname, "..", "frontend", "src", "config", "contract.js"
  );

  const configContent = `export const CONTRACT_ADDRESS = "${contractAddress}";

export const CONTRACT_ABI = [
  "function checkIn() external",
  "function canCheckInToday(address user) external view returns (bool)",
  "function getPoints(address user) external view returns (uint256)",
  "function getCheckInCount(address user) external view returns (uint256)",
  "function getLastCheckInTimestamp(address user) external view returns (uint256)",
  "function getNextCheckinTime(address user) external view returns (uint256)",
  "function getStreak(address user) external view returns (uint256)",
  "function getUserStats(address user) external view returns (uint256 points, uint256 checkInCount, uint256 lastTimestamp, uint256 streak, uint256 nextTime, bool canCheckIn)",
  "event CheckedIn(address indexed user, uint256 pointsAdded, uint256 newTotal, uint256 streak, uint256 bonus)",
  "error InvalidAddress()",
  "error AlreadyCheckedInToday()"
];
`;

  fs.writeFileSync(frontendConfigPath, configContent, "utf-8");
  console.log(`✅ 前端配置已自动更新: ${frontendConfigPath}`);
}

main().catch((error) => {
  console.error("\n❌ 部署失败:", error);
  process.exitCode = 1;
});

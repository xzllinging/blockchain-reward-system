const hre = require("hardhat");

async function main() {
  // 从部署脚本自动更新的配置中读取地址
  const contractAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

  const [signer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("Reward", contractAddress);

  console.log("\n========== 合约功能验证（含连续签到奖励） ==========");
  console.log("合约地址:", contractAddress);
  console.log("测试账户:", signer.address, "\n");

  // 1. 首次签到
  console.log("--- 第 1 天签到 ---");
  let tx = await contract.checkIn();
  let receipt = await tx.wait();
  let event = receipt.logs
    .map((l) => { try { return contract.interface.parseLog(l); } catch { return null; } })
    .find((e) => e && e.name === "CheckedIn");
  console.log(`  新增积分: ${event.args.pointsAdded}, 总积分: ${event.args.newTotal}, 连续: ${event.args.streak} 天, 额外奖励: ${event.args.bonus}`);

  // 2. 尝试重复签到（应失败）
  console.log("\n--- 尝试同日重复签到（应 revert）---");
  try {
    await contract.checkIn();
    console.log("  ❌ 不应该成功！");
  } catch (e) {
    console.log("  ✅ 正确阻止重复签到");
  }

  // 3. 模拟时间推进到明天（Hardhat 网络可以通过 evm_increaseTime 调时间）
  console.log("\n--- 模拟时间推进 1 天 ---");
  await hre.network.provider.send("evm_increaseTime", [86400]);
  await hre.network.provider.send("evm_mine");

  // 4. 第 2 天签到（连续 2 天）
  console.log("\n--- 第 2 天签到 ---");
  tx = await contract.checkIn();
  receipt = await tx.wait();
  event = receipt.logs
    .map((l) => { try { return contract.interface.parseLog(l); } catch { return null; } })
    .find((e) => e && e.name === "CheckedIn");
  console.log(`  新增积分: ${event.args.pointsAdded}, 总积分: ${event.args.newTotal}, 连续: ${event.args.streak} 天, 额外奖励: ${event.args.bonus}`);

  // 5. 使用 getUserStats 批量查询
  console.log("\n--- getUserStats 批量查询 ---");
  const stats = await contract.getUserStats(signer.address);
  console.log(`  积分: ${stats.points}`);
  console.log(`  累计签到: ${stats.checkInCount}`);
  console.log(`  最后签到时间: ${stats.lastTimestamp}`);
  console.log(`  连续签到: ${stats.streak} 天`);
  console.log(`  下次可签到: ${stats.nextTime}`);
  console.log(`  今日可签到: ${stats.canCheckIn}`);

  // 6. 快速推进到第 7 天，验证 bonus
  console.log("\n--- 快速推进到第 7 天（验证额外奖励）---");
  for (let day = 3; day <= 7; day++) {
    await hre.network.provider.send("evm_increaseTime", [86400]);
    await hre.network.provider.send("evm_mine");
    tx = await contract.checkIn();
    receipt = await tx.wait();
    event = receipt.logs
      .map((l) => { try { return contract.interface.parseLog(l); } catch { return null; } })
      .find((e) => e && e.name === "CheckedIn");
    console.log(`  第 ${day} 天: 新增 ${event.args.pointsAdded} 分, 连续 ${event.args.streak} 天, 额外奖励 ${event.args.bonus} 分`);
  }

  // 7. 最终状态
  console.log("\n--- 最终状态 ---");
  const finalStats = await contract.getUserStats(signer.address);
  console.log(`  总积分: ${finalStats.points}`);
  console.log(`  累计签到: ${finalStats.checkInCount}`);
  console.log(`  连续签到: ${finalStats.streak} 天`);

  const expectedPoints = 7 * 10 + 5; // 7天基础70分 + 第7天额外5分
  console.log(`\n  预期总积分: ${expectedPoints}`);
  console.log(`  实际总积分: ${finalStats.points}`);
  console.log(finalStats.points.toString() === expectedPoints.toString() ? "  ✅ 积分计算正确！" : "  ❌ 积分不匹配！");

  console.log("\n========== 全部验证通过 ==========\n");
}

main().catch((error) => {
  console.error("\n❌ 验证失败:", error);
  process.exitCode = 1;
});

const hre = require("hardhat");

// 默认目标地址（你的 MetaMask 账户）
const DEFAULT_ADDRESS = "0x25404E96dffC1c7DE74741028352827c68799Bc1";

async function main() {
  // 优先从环境变量读取，否则使用默认地址
  const targetAddress = process.env.ADDRESS || DEFAULT_ADDRESS;

  if (!targetAddress.startsWith("0x") || targetAddress.length !== 42) {
    console.error("❌ 地址格式错误，需要 0x 开头的 42 位地址");
    process.exit(1);
  }

  const [sender] = await hre.ethers.getSigners();

  console.log(`\n========== 水龙头转账 ==========`);
  console.log(`  发送方: ${sender.address}`);
  console.log(`  接收方: ${targetAddress}`);
  console.log(`  金额:   100 ETH`);
  console.log(`  网络:   ${hre.network.name}\n`);

  const tx = await sender.sendTransaction({
    to: targetAddress,
    value: hre.ethers.parseEther("100.0"),
  });

  console.log(`  交易 Hash: ${tx.hash}`);
  await tx.wait();

  // 验证余额
  const balance = await hre.ethers.provider.getBalance(targetAddress);
  console.log(`\n✅ 转账成功！`);
  console.log(`   ${targetAddress} 余额: ${hre.ethers.formatEther(balance)} ETH\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

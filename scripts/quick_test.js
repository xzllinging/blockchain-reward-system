const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const [signer] = await hre.ethers.getSigners();

  console.log("合约地址:", CONTRACT_ADDRESS);
  console.log("调用账户:", signer.address);

  const contract = await hre.ethers.getContractAt("Reward", CONTRACT_ADDRESS);

  const canCheck = await contract.canCheckInToday(signer.address);
  console.log("canCheckInToday:", canCheck);

  const streak = await contract.getStreak(signer.address);
  console.log("streak:", streak.toString());

  const pts = await contract.getPoints(signer.address);
  console.log("积分:", pts.toString());

  if (canCheck) {
    console.log("\n执行签到...");
    const tx = await contract.checkIn();
    await tx.wait();
    console.log("✅ 签到成功! txHash:", tx.hash);
    const pts2 = await contract.getPoints(signer.address);
    console.log("签到后积分:", pts2.toString());
  } else {
    console.log("⚠️ 今日已签到（合约状态正常，非问题）");
  }
}

main().catch(console.error);

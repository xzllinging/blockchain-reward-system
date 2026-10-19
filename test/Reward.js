const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reward", function () {
  let reward;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Reward = await ethers.getContractFactory("Reward");
    reward = await Reward.deploy();
    await reward.waitForDeployment();
  });

  // ==================== 部署测试 ====================
  it("部署后初始积分应为 0", async function () {
    expect(await reward.getPoints(addr1.address)).to.equal(0);
    expect(await reward.getCheckInCount(addr1.address)).to.equal(0);
  });

  // ==================== 签到测试 ====================
  it("签到后积分应 +10", async function () {
    await reward.connect(addr1).checkIn();
    expect(await reward.getPoints(addr1.address)).to.equal(10);
  });

  it("签到后累计次数应为 1", async function () {
    await reward.connect(addr1).checkIn();
    expect(await reward.getCheckInCount(addr1.address)).to.equal(1);
  });

  it("签到后应更新最后签到时间戳", async function () {
    const before = await reward.getLastCheckInTimestamp(addr1.address);
    expect(before).to.equal(0);

    await reward.connect(addr1).checkIn();
    const after = await reward.getLastCheckInTimestamp(addr1.address);
    expect(after).to.be.gt(0);
  });

  it("同一自然日重复签到应失败", async function () {
    await reward.connect(addr1).checkIn();
    await expect(
      reward.connect(addr1).checkIn()
    ).to.be.revertedWith("Reward: already checked in today");
  });

  it("多个用户签到互不影响", async function () {
    await reward.connect(addr1).checkIn();
    await reward.connect(addr2).checkIn();

    expect(await reward.getPoints(addr1.address)).to.equal(10);
    expect(await reward.getPoints(addr2.address)).to.equal(10);
    expect(await reward.getCheckInCount(addr1.address)).to.equal(1);
    expect(await reward.getCheckInCount(addr2.address)).to.equal(1);
  });

  it("多次累计签到积分正确叠加", async function () {
    // Day 1
    await reward.connect(addr1).checkIn();
    expect(await reward.getPoints(addr1.address)).to.equal(10);

    // 模拟第二天（Hardhat 可操控时间）
    await ethers.provider.send("evm_increaseTime", [86401]); // +1 天 +1 秒
    await ethers.provider.send("evm_mine");                  // 挖一个块

    await reward.connect(addr1).checkIn();
    expect(await reward.getPoints(addr1.address)).to.equal(20);
    expect(await reward.getCheckInCount(addr1.address)).to.equal(2);
  });

  // ==================== 事件测试 ====================
  it("签到应触发 CheckedIn 事件", async function () {
    await expect(reward.connect(addr1).checkIn())
      .to.emit(reward, "CheckedIn")
      .withArgs(addr1.address, 10, 10);
  });

  // ==================== 查询测试 ====================
  it("getPoints 可查询任意地址", async function () {
    await reward.connect(addr1).checkIn();
    // addr2 查询 addr1 的积分
    expect(await reward.connect(addr2).getPoints(addr1.address)).to.equal(10);
  });

  it("从未签到的用户积分为 0，次数为 0", async function () {
    expect(await reward.getPoints(owner.address)).to.equal(0);
    expect(await reward.getCheckInCount(owner.address)).to.equal(0);
    expect(await reward.getLastCheckInTimestamp(owner.address)).to.equal(0);
  });
});

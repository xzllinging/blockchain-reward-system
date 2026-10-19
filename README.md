# 💰 基于以太坊的区块链积分奖励系统 (Blockchain Reward System)

## 📌 项目简介
本项目是一个基于以太坊的去中心化 DApp，实现了 Web3 的“每日签到获取积分”功能。项目采用 **AI 驱动开发 (AI-Assisted Development)** 模式完成，通过多轮 Prompt 迭代，实现了从智能合约编写、前端组件开发到网络调试的完整闭环。

## 🛠️ 技术栈
*   **智能合约**：Solidity (`^0.8.4`)、Hardhat、Custom Error、NatSpec
*   **前端框架**：React (Vite)、JSX
*   **Web3 交互**：ethers.js (v6)、MetaMask
*   **开发模式**：AI 协同开发 (WorkBuddy / ChatGPT)

## ✨ 核心功能
1.  **钱包连接与网络检测**：自动检测 MetaMask 当前网络，若网络错误，支持一键切换至本地 Hardhat 链 (Chain ID: `887766`)。
2.  **每日签到 (Check-in)**：基于 `block.timestamp` 判断自然日，防止同日重复签到。
3.  **连续签到奖励**：独特的 `streak` 连续签到逻辑，连续签到满 7 天倍数时，额外奖励积分。
4.  **UI 倒计时交互**：计算次日零点时间戳，前端实现倒计时防抖，归零后自动解锁签到按钮。
5.  **批量数据查询**：封装 `getUserStats` 函数，将 5 次 RPC 查询合并为 1 次，优化前端性能。

## 🏗️ 项目架构与核心逻辑
*   **合约层 (`contracts/Reward.sol`)**：
    *   使用了自定义错误 (`Custom Error`) 替代 `require`，降低 Gas 消耗。
    *   包含完善的 `NatSpec` 文档注释。
    *   定义了 `CheckedIn` 事件，前端通过解析 `receipt.logs` 实时获取签到奖励数据。
*   **交互层 (`frontend/src/utils/contract.js`)**：
    *   封装了 `isCorrectNetwork` 与 `switchToTargetNetwork`，解决开发中最常见的链 ID 不匹配问题。
*   **组件层 (`frontend/src/components`)**：
    *   拆分了 `WalletConnect`、`CheckIn`、`QueryPoints` 组件，实现状态实时刷新。

## 🛠️ AI 辅助开发与 Bug 修复记录
在开发过程中，我通过 7 轮 Prompt 迭代，让 AI 协助解决了两个核心 Bug：

1.  **Bug 1：MetaMask 网络错误 (Chain ID Mismatch)**
    *   **报错现象**：点击签到时，MetaMask 提示红色警告，无法确认。
    *   **排查修复**：将控制台报错发给 AI，AI 诊断出 MetaMask 处于以太坊主网，而合约在本地 Hardhat 链。引入 `switchToTargetNetwork` 自动请求切换网络，修复成功。
2.  **Bug 2：Transaction ran out of gas**
    *   **报错现象**：添加连续签到逻辑后，交易失败。
    *   **排查修复**：AI 分析出合约新增了状态变量存储，Gas 需求增加，而前端硬编码了 `gasLimit: 100000`。删掉硬编码，让 `ethers` 自动估算 Gas，修复成功。

## 💻 本地运行指南
1.  **启动本地链**：终端输入 `npx hardhat node`
2.  **部署合约**：终端输入 `npx hardhat run scripts/deploy.js --network localhost`
3.  **启动前端**：
    ```bash
    cd frontend
    npm install
    npm run dev
    环境配置：在 MetaMask 添加本地网络，RPC URL 为 http://127.0.0.1:8545，Chain ID 为 887766

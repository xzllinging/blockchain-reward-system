// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Reward
 * @notice 区块链校园奖励系统——每日签到获取积分（含连续签到奖励）
 * @dev 基于 Solidity 0.8.x，使用 Custom Error 节省 gas，NatSpec 全覆盖。
 *      连续签到每满 7 天额外奖励 +5 积分，断签后 streak 重置为 1。
 */
contract Reward {
    // ==================== 常量 ====================

    /// @notice 一天的秒数常量，用于按自然日判断签到
    uint256 public constant SECONDS_PER_DAY = 86400;

    /// @notice 每次签到奖励的固定积分数
    uint256 public constant CHECK_IN_REWARD = 10;

    /// @notice 连续签到满 7 天的额外奖励积分数
    uint256 public constant STREAK_BONUS = 5;

    /// @notice 连续签到奖励周期（每 7 天触发一次额外奖励）
    uint256 public constant STREAK_INTERVAL = 7;

    // ==================== Custom Errors ====================

    /// @notice 调用者地址无效（零地址）
    error InvalidAddress();

    /// @notice 当日已经签到过，不可重复签到
    error AlreadyCheckedInToday();

    // ==================== 状态变量 ====================

    /// @dev 每个地址的积分余额
    mapping(address => uint256) private _points;

    /// @dev 每个地址的累计签到次数
    mapping(address => uint256) private _checkInCount;

    /// @dev 每个地址最后一次签到的 Unix 时间戳
    mapping(address => uint256) private _lastCheckInTimestamp;

    /// @dev 每个地址的连续签到天数（断签后重置为 1）
    mapping(address => uint256) private _consecutiveDays;

    // ==================== 事件 ====================

    /**
     * @notice 签到成功时触发
     * @param user        签到用户地址（可索引，便于链下筛选）
     * @param pointsAdded 本次新增积分（含基础奖励 + 可能的连续签到奖励）
     * @param newTotal    签到后积分总量
     * @param streak      当前连续签到天数
     * @param bonus       本次获得的连续签到额外奖励（0 或 STREAK_BONUS）
     */
    event CheckedIn(
        address indexed user,
        uint256 pointsAdded,
        uint256 newTotal,
        uint256 streak,
        uint256 bonus
    );

    // ==================== 签到函数 ====================

    /**
     * @notice 每日签到，每天只能签到一次
     * @dev 使用 block.timestamp / SECONDS_PER_DAY 判断自然日，防止同日重复签到。
     *      若上次签到是昨天，则连续天数 +1；否则断签，连续天数重置为 1。
     *      连续天数每满 STREAK_INTERVAL（7 天）额外获得 STREAK_BONUS（5）积分。
     *      调用前可通过 canCheckInToday() 或 getUserStats() 预查询状态。
     */
    function checkIn() external {
        if (msg.sender == address(0)) revert InvalidAddress();

        uint256 todayDay = block.timestamp / SECONDS_PER_DAY;
        uint256 lastDay  = _lastCheckInTimestamp[msg.sender] / SECONDS_PER_DAY;

        if (todayDay <= lastDay) revert AlreadyCheckedInToday();

        // ----- 连续签到逻辑 -----
        uint256 yesterdayDay = todayDay - 1;
        if (lastDay == yesterdayDay) {
            _consecutiveDays[msg.sender] += 1;
        } else {
            _consecutiveDays[msg.sender] = 1;
        }

        uint256 streak = _consecutiveDays[msg.sender];
        uint256 bonus = (streak > 0 && streak % STREAK_INTERVAL == 0)
            ? STREAK_BONUS
            : 0;
        uint256 totalReward = CHECK_IN_REWARD + bonus;
        // ------------------------

        _lastCheckInTimestamp[msg.sender] = block.timestamp;
        _checkInCount[msg.sender]        += 1;
        _points[msg.sender]              += totalReward;

        emit CheckedIn(msg.sender, totalReward, _points[msg.sender], streak, bonus);
    }

    // ==================== 查询函数 ====================

    /**
     * @notice 判断指定用户今日是否可以签到
     * @param user 要查询的用户地址
     * @return true 表示今日尚未签到，可以签到；false 表示今日已签到
     */
    function canCheckInToday(address user) external view returns (bool) {
        uint256 today   = block.timestamp / SECONDS_PER_DAY;
        uint256 lastDay = _lastCheckInTimestamp[user] / SECONDS_PER_DAY;
        return today > lastDay;
    }

    /**
     * @notice 查询指定用户下一次可签到的时间戳
     * @dev 返回下一个自然日零点的 Unix 时间戳（而非上次签到 +24h），
     *      这样用户 23:59 签到后，0:01 即可再次签到，体验更合理。
     *      若用户从未签到，返回 0，表示立即可签到。
     * @param user 要查询的用户地址
     * @return 下次可签到的时间戳（Unix 秒），0 表示从未签到、可立即签到
     */
    function getNextCheckinTime(address user) external view returns (uint256) {
        uint256 lastTs = _lastCheckInTimestamp[user];
        if (lastTs == 0) return 0; // 从未签到，可立即签到
        uint256 lastDay = lastTs / SECONDS_PER_DAY;
        return (lastDay + 1) * SECONDS_PER_DAY; // 下一个自然日零点
    }

    /**
     * @notice 查询指定地址的连续签到天数
     * @param user 要查询的用户地址
     * @return 连续签到天数（断签后为 1，从未签到为 0）
     */
    function getStreak(address user) external view returns (uint256) {
        return _consecutiveDays[user];
    }

    /**
     * @notice 查询指定地址的积分余额
     * @param user 要查询的用户地址
     * @return 该地址当前持有的积分数量
     */
    function getPoints(address user) external view returns (uint256) {
        return _points[user];
    }

    /**
     * @notice 查询指定地址的累计签到次数
     * @param user 要查询的用户地址
     * @return 该地址累计签到总次数
     */
    function getCheckInCount(address user) external view returns (uint256) {
        return _checkInCount[user];
    }

    /**
     * @notice 查询指定地址最后一次签到的时间戳
     * @param user 要查询的用户地址
     * @return 最后一次签到的 Unix 时间戳（0 表示从未签到）
     */
    function getLastCheckInTimestamp(address user) external view returns (uint256) {
        return _lastCheckInTimestamp[user];
    }

    /**
     * @notice 批量查询指定用户的全部状态数据
     * @dev 将 5 次独立 RPC 调用合并为 1 次，显著减少前端加载时间。
     * @param user 要查询的用户地址
     * @return points        积分余额
     * @return checkInCount  累计签到次数
     * @return lastTimestamp 最后一次签到时间戳
     * @return streak        连续签到天数
     * @return nextTime      下次可签到时间戳（0 表示立即可签到）
     * @return canCheckIn    今日是否可签到
     */
    function getUserStats(address user)
        external
        view
        returns (
            uint256 points,
            uint256 checkInCount,
            uint256 lastTimestamp,
            uint256 streak,
            uint256 nextTime,
            bool    canCheckIn
        )
    {
        points        = _points[user];
        checkInCount  = _checkInCount[user];
        lastTimestamp = _lastCheckInTimestamp[user];
        streak        = _consecutiveDays[user];

        if (lastTimestamp == 0) {
            nextTime = 0;
        } else {
            uint256 lastDayForNext = lastTimestamp / SECONDS_PER_DAY;
            nextTime = (lastDayForNext + 1) * SECONDS_PER_DAY;
        }

        uint256 today   = block.timestamp / SECONDS_PER_DAY;
        uint256 lastDay = lastTimestamp / SECONDS_PER_DAY;
        canCheckIn = today > lastDay;
    }
}

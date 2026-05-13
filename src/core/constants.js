/**
 * 全局常量
 * 凡是 setTimeout(..., 30000) / setInterval(..., 500) 这种魔术数字
 * 都集中在这里命名,方便后续调整
 */

export const CONST = {
    // ── 时间相关(秒) 
    INVITE_TIMEOUT_SEC: 30,        // 邀请过期时间
    DISBAND_CONFIRM_SEC: 30,       // 解散二次确认窗口

    // ── 时间相关(毫秒) 
    CHUNK_LOAD_POLL_MS: 100,       // 创岛后区块加载检测周期
    TRACKER_INTERVAL_MS: 500,      // 玩家位置轮询间隔
    STORAGE_FLUSH_MS: 500,         // 存储防抖刷盘间隔

    // ── 长度限制 
    NAME_MAX_LEN: 16,              // warp 名称最大长度
    ID_LEN: 16,                    // 岛屿 id 长度

    // ── 维度 id 
    DIM_OVERWORLD: 0,
    DIM_NETHER: 1,
    DIM_END: 2,

    // ── 信任等级 
    TRUST_OWNER: 1,                // 岛主
    TRUST_MEMBER: 2,               // 普通成员

    // ── 文本提示位置(player.tell mode)
    TELL_CHAT: 0,
    TELL_ACTIONBAR: 4,
};

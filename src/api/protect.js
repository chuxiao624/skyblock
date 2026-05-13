/**
 * 对外保护 API
 */

import { Protect } from "plugins/skyblock/src/services/ProtectionService.js";

export const protect = {
    /** 玩家在某点是否有某权限(布尔) */
    checkPerm(player, pos, key) { return Protect.check(player, pos, key); },

    /** 同 checkPerm , 但没权限时给玩家发提示。事件回调里 return 这个 */
    assertPerm(player, pos, key) { return Protect.assert(player, pos, key); },

    /** 世界事件(无 player) */
    checkEventPerm(pos, key) { return Protect.checkEvent(pos, key); },

    /** 通过坐标找岛 id */
    findIslandId(pos) { return Protect.findIslandId(pos); },
};

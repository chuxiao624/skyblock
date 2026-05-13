/**
 * 岛屿保护
 *
 * 优先级:
 *   1. OP (配置文件进行开关)
 *   2. 末地 -> 走全局
 *   3. 地狱 + 不视作岛屿 -> 走全局  
 *   4. 坐标是某个岛屿:
 *        a. 玩家是该岛成员 -> 放行
 *        b. 玩家在 allowlist 中且权限节点匹配 -> 放行
 *        c. 否则用该岛 defaults
 *   5. 坐标不在任何岛屿  -> 走全局
 */

import { IslandSvc } from "plugins/skyblock/src/services/IslandService.js";
import { Permission as PermRepo } from "plugins/skyblock/src/repos/PermissionRepo.js";
import { PermsCfg } from "plugins/skyblock/src/repos/PermsConfigRepo.js";
import { config } from "plugins/skyblock/src/core/Config.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { CONST } from "plugins/skyblock/src/core/constants.js";

class ProtectionService {

    findIslandId(pos) { return IslandSvc.findByPos(pos); }

    /**
     * 检查权限
     * @param {Player} player
     * @param {{x,z,dimid}} pos
     * @param {string} key
     * @returns {boolean}
     */
    check(player, pos, key) {
        if (!player) return false;
        const dim = pos.dimid;
        const netherIsIsland = !!config.get("nether_as_island");

        // OP
        if (config.get("admin_bypass") && player.isOP && player.isOP()) return true;

        // 末地始终全局
        if (dim === CONST.DIM_END) return PermsCfg.getDefault(key, dim) ?? false;

        // 地狱不视作岛屿 -> 全局
        if (dim === CONST.DIM_NETHER && !netherIsIsland) return PermsCfg.getDefault(key, dim) ?? false;

        const islandId = this.findIslandId(pos);

        // 不是岛屿 走全局
        if (!islandId) return PermsCfg.getDefault(key, dim) ?? false;

        // 自己/同岛成员
        const island = IslandSvc.getById(islandId);
        if (island?.members?.[player.xuid]) return true;

        // 白名单
        const allowlist = PermRepo.get(islandId, "allowlist")?.[player.xuid];
        if (allowlist?.includes(key)) return true;

        // 默认值
        const defaults = PermRepo.get(islandId, "defaults");
        return defaults?.[key] ?? false;
    }

    /**
     * 检查 + 不通过时给玩家提示
     */
    assert(player, pos, key) {
        const ok = this.check(player, pos, key);
        if (!ok && player) {
            try { player.tell(i18n.tr("protection.error"), CONST.TELL_ACTIONBAR); } catch (_) { }
        }
        return ok;
    }

    /**
     * 检查世界事件类(爆炸/火/凋零等)
     * 只看坐标和事件名
     */
    checkEvent(pos, key) {
        const dim = pos.dimid;
        const netherIsIsland = !!config.get("nether_as_island");

        if (dim === CONST.DIM_END) return PermsCfg.getEvent(key, dim);
        if (dim === CONST.DIM_NETHER && !netherIsIsland) return PermsCfg.getEvent(key, dim);

        const islandId = this.findIslandId(pos);
        if (!islandId) return PermsCfg.getEvent(key, dim);

        const events = PermRepo.get(islandId, "events");
        return events?.[key] ?? false;
    }
}

export const Protect = new ProtectionService();

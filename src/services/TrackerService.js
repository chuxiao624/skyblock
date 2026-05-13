/**
 * 玩家位置追踪
 *
 */
import { Event } from "plugins/skyblock/src/core/EventBus.js";
import { config } from "plugins/skyblock/src/core/Config.js";
import { CONST } from "plugins/skyblock/src/core/constants.js";
import { Protect } from "plugins/skyblock/src/services/ProtectionService.js";

class TrackerService {
    constructor() {
        // xuid -> islandId
        this.playerIslandMap = new Map();
    }

    /** 玩家进入岛屿 */
    enter(player, islandId) {
        const xuid = player.xuid;
        const cur = this.playerIslandMap.get(xuid);

        if (cur === islandId) {
            Event.emit("player:stayOnIsland", player, islandId);
            return;
        }

        if (cur) Event.emit("player:leaveIsland", player, cur);
        this.playerIslandMap.set(xuid, islandId);
        Event.emit("player:enterIsland", player, islandId);
    }

    /** 玩家离开某个岛屿 */
    leave(player) {
        const xuid = player.xuid;
        const cur = this.playerIslandMap.get(xuid);
        if (!cur) return;
        this.playerIslandMap.delete(xuid);
        Event.emit("player:leaveIsland", player, cur);
    }

    /** 玩家下线清理 */
    onLeft(player) {
        this.playerIslandMap.delete(player.xuid);
    }

    tick() {
        const list = mc.getOnlinePlayers();

        if (!list || list.length === 0) return;

        const netherIsIsland = !!config.get("nether_as_island");

        for (const p of list) {

            const dim = p.pos.dimid;
            // 末地 / (地狱不视作岛屿) -> 直接视为离岛
            if (dim == CONST.DIM_END || (dim === CONST.DIM_NETHER && !netherIsIsland)) {
                this.leave(p);
                continue;
            }
            const islandId = Protect.findIslandId(p.pos);

            if (islandId) {
                this.enter(p, islandId)
            } else {
                this.leave(p);
            }

        }
    }
}

export const Tracker = new TrackerService();

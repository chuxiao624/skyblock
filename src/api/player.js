/**
 * LLSE_Player 原型扩展
 *
 * 提供给业务层的便捷 getter
 */

import { Tracker } from "plugins/skyblock/src/services/TrackerService.js";
import { IslandSvc } from "plugins/skyblock/src/services/IslandService.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { CONST } from "plugins/skyblock/src/core/constants.js";
import { config } from "plugins/skyblock/src/core/Config.js";

const PREFIX = () => i18n.tr("skyblock.prefix") || "§a[空岛]§r";

function defineGetter(name, getter) {
    try { delete LLSE_Player.prototype[name]; } catch (_) { }
    Object.defineProperty(LLSE_Player.prototype, name, {
        get: getter,
        configurable: true,
    });
}

function defineMethod(name, fn) {
    try { delete LLSE_Player.prototype[name]; } catch (_) { }
    Object.defineProperty(LLSE_Player.prototype, name, {
        value: fn,
        configurable: true,
        writable: true,
    });
}

// 方法 

defineMethod("sendMsg", function (msg, mode = CONST.TELL_CHAT) {
    this.sendText(`${PREFIX()} ${msg}`, mode);
});

// getter

// 玩家的岛屿id
defineGetter("islandId", function () {
    return IslandSvc.xuid2Id(this.xuid);
});

defineGetter("island", function () {
    const id = IslandSvc.xuid2Id(this.xuid);
    return id ? IslandSvc.getById(id) : null;
});



defineGetter("isAdmin", function () {

    return config.get("admins")?.includes(this.xuid);
})

defineGetter("islandSpawn", function () {
    return this.island?.members?.[this.xuid]?.spawn ?? null;
});

defineGetter("islandMembers", function () {
    return this.island?.members ?? null;
});

defineGetter("isIslandOwner", function () {
    return this.isAdmin || this.island?.owner === this.xuid;
});

// 玩家此刻物理位置所在的岛屿(可能是别人家)
defineGetter("currentIslandId", function () {
    return Tracker.playerIslandMap.get(this.xuid) ?? null;
});

defineGetter("isOnOwnIsland", function () {
    const cur = Tracker.playerIslandMap.get(this.xuid);
    return cur != null && cur === this.islandId;
});

// 守卫(命令前置检查)

defineMethod("guardIsland", function () {
    if (!this.islandId) {
        this.sendMsg(i18n.tr("guard.no_island"));
        return false;
    }
    return true;
});

defineMethod("guardOwner", function () {
    if (!this.guardIsland()) return false;
    if (!this.isIslandOwner) {
        this.sendMsg(i18n.tr("guard.not_owner"));
        return false;
    }
    return true;
});

defineMethod("guardInIsland", function () {
    if (!this.isOnOwnIsland) {
        this.sendMsg(i18n.tr("guard.not_on_island"));
        return false;
    }
    return true;
});

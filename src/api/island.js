/**
 * 对外岛屿 API
 * 薄壳:转发到 IslandService
 * 提供给扩展插件
 */

import { IslandSvc } from "plugins/skyblock/src/services/IslandService.js";

export const island = {
    /** 通过 islandId 获取整个岛屿数据 */
    getIslandData(islandId, key) {
        const data = IslandSvc.getById(islandId);
        if (!data) return null;
        return key ? data[key] : data;
    },

    /** 取岛屿名(带缓存) */
    getIslandName(islandId) { return IslandSvc.getName(islandId); },

    /** xuid -> islandId */
    xuid2islandId(xuid) { return IslandSvc.xuid2Id(xuid); },

    /** 玩家解散过几次岛 */
    getDelCount(xuid) { return IslandSvc.getDelCount(xuid); },

    /** 创建岛屿(返回 {ok, code, ...}) */
    createIsland(xuid, ownerName, template) {
        return IslandSvc.create(xuid, ownerName, template);
    },

    removeIsland(islandId, opts) { return IslandSvc.remove(islandId, opts); },
    addMember(islandId, xuid, trustLevel) { return IslandSvc.addMember(islandId, xuid, trustLevel); },
    removeMember(islandId, xuid) { return IslandSvc.removeMember(islandId, xuid); },
    setSpawn(islandId, xuid, spawn) { return IslandSvc.setSpawn(islandId, xuid, spawn); },
    rename(islandId, name) { return IslandSvc.rename(islandId, name); },
    transfer(islandId, newOwnerXuid, newOwnerName) { return IslandSvc.transfer(islandId, newOwnerXuid, newOwnerName); },
    resetDelCount(xuid) { return IslandSvc.resetDelCount(xuid); },
    resize(islandId, newSize) { return IslandSvc.resize(islandId, newSize); },

    /** 扩建岛屿:四个方向各 +delta 格,即新边长 = 当前 + delta*2 */
    expand(islandId, delta) {
        if (!Number.isFinite(delta) || delta <= 0) return { ok: false, code: "invalid_delta" };
        const isl = IslandSvc.getById(islandId);
        if (!isl) return { ok: false, code: "no_island" };
        const cur = isl.range.max[0] - isl.range.min[0] + 1;
        return IslandSvc.resize(islandId, cur + delta * 2);
    },

    /** 缩小岛屿:四个方向各 -delta 格,即新边长 = 当前 - delta*2 */
    shrink(islandId, delta) {
        if (!Number.isFinite(delta) || delta <= 0) return { ok: false, code: "invalid_delta" };
        const isl = IslandSvc.getById(islandId);
        if (!isl) return { ok: false, code: "no_island" };
        const cur = isl.range.max[0] - isl.range.min[0] + 1;
        return IslandSvc.resize(islandId, cur - delta * 2);
    },
    createCustom(adminXuid, name, template) { return IslandSvc.createCustom(adminXuid, name, template); },
    setIslandSpawn(islandId, spawn) { return IslandSvc.setIslandSpawn(islandId, spawn); },
    listAll() { return IslandSvc.listAll(); },
    listByKind(kind) { return IslandSvc.listByKind(kind); },

    /** 通过坐标找到所在岛屿 id(可空) */
    findByPos(pos) { return IslandSvc.findByPos(pos); },
};

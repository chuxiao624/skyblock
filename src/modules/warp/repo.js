
const WARP_CONFIG = {
    maxWarps: 5,
    signTag: "[传送点]",
    activeMark: "§a",
};

function posToKey(pos) { return `${pos.x}_${pos.y}_${pos.z}_${pos.dimid}`; }
function keyToPos(key) { return key.split("_").map(Number); }

import { Warp } from "plugins/skyblock/src/repos/WarpRepo.js";

export const WarpData = {
    CONFIG: WARP_CONFIG,

    posToKey, keyToPos,

    list(islandId) { return Warp.list(islandId); },
    get(islandId, name) { return Warp.get(islandId, name); },
    listPublic(islandId) { return Warp.listPublic(islandId); },

    set(islandId, name, signPos) {
        Warp.set(islandId, name, posToKey(signPos));
    },
    rename(islandId, oldN, newN) { return Warp.rename(islandId, oldN, newN); },
    del(islandId, name) { return Warp.del(islandId, name); },
    delByPos(islandId, signPos) { return Warp.delByPos(islandId, posToKey(signPos)); },
    togglePublic(islandId, name) { return Warp.togglePublic(islandId, name); },

    isOverLimit(islandId) {
        return Object.keys(Warp.list(islandId)).length >= WARP_CONFIG.maxWarps;
    },

    readAll() { return Warp.readAll(); },

    // 233 测试
    isValidName(name) {
        if (!name) return false;
        if (name.length > 16) return false;
        // 不允许颜色码 § 与控制字符
        if (/§/.test(name)) return false;
        return true;
    },
};

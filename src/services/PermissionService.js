/**
 * 权限业务服务
 * 对 PermissionRepo 的封装,统一对外接口
 */

import { Permission as PermRepo } from "plugins/skyblock/src/repos/PermissionRepo.js";

class PermissionService {
    get(islandId, key) { return PermRepo.get(islandId, key); }
    setDefaults(islandId, v) { return PermRepo.set(islandId, "defaults", v); }
    setEvents(islandId, v) { return PermRepo.set(islandId, "events", v); }

    addPermToPlayer(islandId, xuid, node) {
        const island = PermRepo.get(islandId);
        if (!island) return false;
        if (!island.allowlist[xuid]) island.allowlist[xuid] = [];
        if (!island.allowlist[xuid].includes(node)) island.allowlist[xuid].push(node);
        PermRepo.set(islandId, "allowlist", island.allowlist);
        return true;
    }

    removePermFromPlayer(islandId, xuid, node) {
        const island = PermRepo.get(islandId);
        if (!island) return false;
        const arr = island.allowlist?.[xuid];
        if (!arr) return false;
        const i = arr.indexOf(node);
        if (i === -1) return false;
        arr.splice(i, 1);
        if (arr.length === 0) delete island.allowlist[xuid];
        PermRepo.set(islandId, "allowlist", island.allowlist);
        return true;
    }

    setPlayerPerms(islandId, xuid, perms) {
        const island = PermRepo.get(islandId);
        if (!island) return false;
        if (!perms || perms.length === 0) delete island.allowlist[xuid];
        else island.allowlist[xuid] = perms;
        PermRepo.set(islandId, "allowlist", island.allowlist);
        return true;
    }
}

export const PermSvc = new PermissionService();

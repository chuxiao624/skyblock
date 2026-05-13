/**
 * 对外权限 API(转发 PermSvc)
 */

import { PermSvc } from "plugins/skyblock/src/services/PermissionService.js";

export const perms = {
    get(islandId, key) { return PermSvc.get(islandId, key); },
    setDefaults(islandId, defaults) { return PermSvc.setDefaults(islandId, defaults); },
    setEvents(islandId, events) { return PermSvc.setEvents(islandId, events); },
    addPermToPlayer(islandId, xuid, node) { return PermSvc.addPermToPlayer(islandId, xuid, node); },
    removePermFromPlayer(islandId, xuid, node) { return PermSvc.removePermFromPlayer(islandId, xuid, node); },
    setPlayerPerms(islandId, xuid, p) { return PermSvc.setPlayerPerms(islandId, xuid, p); },
};

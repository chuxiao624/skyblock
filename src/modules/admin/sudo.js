/**
 * /isa sudo / sudo exit
 */

import { AdminProxySvc } from "plugins/skyblock/src/services/AdminProxyService.js";
import { IslandSvc } from "plugins/skyblock/src/services/IslandService.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { L } from "plugins/skyblock/src/core/Logger.js";

const log = L("AdminSudo");


/**
 * 进入代理(根据岛屿 ID)
 * 给 GUI / 命令复用
 */
export function enterByIslandId(player, islandId) {
    if (AdminProxySvc.isInProxy(player.xuid)) {
        const cur = AdminProxySvc.getProxy(player.xuid);
        const islandName = IslandSvc.getName(cur.proxy) ?? cur.proxy;
        return player.sendMsg(i18n.tr("admin.sudo.already", { name: islandName }));
    }
    const r = AdminProxySvc.enter(player.xuid, islandId);
    if (!r.ok) return player.sendMsg(i18n.tr(`admin.sudo.fail.${r.code}`));

    const isl = IslandSvc.getById(islandId);
    const islandName = isl?.name ?? islandId;
    player.sendMsg(i18n.tr("admin.sudo.entered", { name: islandName }));

    if (r.spawn) {
        player.teleport(...r.spawn);
        player.setRespawnPosition(...r.spawn);
    }
}


/**
 * /isa sudo [玩家名]
 *  - 不传:用 player.currentIslandId(物理位置所在岛)
 *  - 传:解析玩家名 → xuid → islandId
 */
export function handleSudo(player, targetName) {
    let targetIslandId;
    if (targetName) {
        const xuid = data.name2xuid(targetName);
        if (!xuid) return player.sendMsg(i18n.tr("admin.sudo.no_player", { name: targetName }));
        targetIslandId = IslandSvc.xuid2Id(xuid);
        if (!targetIslandId) return player.sendMsg(i18n.tr("admin.sudo.target_no_island", { name: targetName }));
    } else {
        targetIslandId = player.currentIslandId;
        if (!targetIslandId) return player.sendMsg(i18n.tr("admin.sudo.not_on_island"));
    }
    enterByIslandId(player, targetIslandId);
}


/**
 * /isa sudo exit
 */
export function handleSudoExit(player) {
    if (!AdminProxySvc.isInProxy(player.xuid)) {
        return player.sendMsg(i18n.tr("admin.sudo.exit.not_in_proxy"));
    }
    const r = AdminProxySvc.exit(player.xuid);
    if (!r.ok) return player.sendMsg(i18n.tr(`admin.sudo.exit.fail.${r.code}`));
    player.sendMsg(i18n.tr("admin.sudo.exit.done"));
}

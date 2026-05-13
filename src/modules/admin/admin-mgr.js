/**
 * /isa admin add/del/list
 */

import { config } from "plugins/skyblock/src/core/Config.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { AdminProxySvc } from "plugins/skyblock/src/services/AdminProxyService.js";
import { L } from "plugins/skyblock/src/core/Logger.js";

const log = L("AdminMgr");

export function handleAdmin(player, sub, name) {
    if (!sub) return player.sendMsg(i18n.tr("admin.mgr.usage"));
    if (sub === "list") return listAdmins(player);

    if (!name) return player.sendMsg(i18n.tr("admin.mgr.no_name"));
    const xuid = data.name2xuid(name);
    if (!xuid) return player.sendMsg(i18n.tr("admin.mgr.no_player", { name }));

    const admins = config.get("admins") || [];

    if (sub === "add") {
        if (admins.includes(xuid)) return player.sendMsg(i18n.tr("admin.mgr.add.already", { name }));
        config.set("admins", [...admins, xuid]);
        player.sendMsg(i18n.tr("admin.mgr.add.done", { name }));
        log.info(`{g}管理员添加: {y}${name}/${xuid}`);
        return;
    }

    if (sub === "del") {
        if (!admins.includes(xuid)) return player.sendMsg(i18n.tr("admin.mgr.del.not_admin", { name }));
        // 该 admin 当前在代理中,先 offline-safe exit
        if (AdminProxySvc.isInProxy(xuid)) {
            AdminProxySvc.exit(xuid);
            log.warn(`{y}管理员 ${name}/${xuid} 在代理中,已自动 exit`);
        }
        config.set("admins", admins.filter(x => x !== xuid));
        player.sendMsg(i18n.tr("admin.mgr.del.done", { name }));
        log.info(`{g}管理员删除: {y}${name}/${xuid}`);
        return;
    }

    player.sendMsg(i18n.tr("admin.mgr.unknown_sub", { sub }));
}


function listAdmins(player) {
    const admins = config.get("admins") || [];
    if (admins.length === 0) return player.sendMsg(i18n.tr("admin.mgr.list.empty"));

    const lines = admins.map(xuid => {
        const name = data.xuid2name(xuid) ?? "(unknown)";
        return `§e${name} §7${xuid}`;
    }).join("\n");

    player.tell(`§7§m-----§r §b§l管理员列表§r §7§m-----§r\n${lines}`);
}

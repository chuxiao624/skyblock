/**
 * 玩家管理 GUI:模糊搜索 / 详情 / 操作集
 */

import { IslandSvc } from "plugins/skyblock/src/services/IslandService.js";
import { island } from "plugins/skyblock/src/api/island.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { config } from "plugins/skyblock/src/core/Config.js";
import { Store } from "plugins/skyblock/src/core/Store.js";
import { L } from "plugins/skyblock/src/core/Logger.js";
import { openIslandDetail } from "plugins/skyblock/src/modules/admin/island-mgr.js";

const log = L("AdminPlayer");
const PAGE_SIZE = 8;


/**
 * 主入口:列出所有玩家(跟岛屿管理逻辑对齐)
 * 第一个按钮是搜索,点击后才弹搜索输入框
 */
export function openPlayerListGui(player, page = 0, search = "") {
    let all = Store.call("playerinfo:getAll") || [];
    if (search) {
        const ql = search.toLowerCase();
        all = all.filter(info => (info.name || "").toLowerCase().includes(ql));
    }

    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    if (page >= totalPages) page = totalPages - 1;
    if (page < 0) page = 0;
    const pageMatches = all.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const form = mc.newSimpleForm()
        .setTitle(i18n.tr("admin.player.list.title", { page: page + 1, total: totalPages }))
        .setContent(i18n.tr("admin.player.list.tip", {
            count: all.length,
            search: search || i18n.tr("admin.island.list.no_search"),
        }));

    // 按钮顺序:搜索 / 玩家列表 / 上一页 / 下一页
    const actions = [];
    form.addButton(i18n.tr("admin.player.list.btn.search"));
    actions.push({ kind: "search" });
    pageMatches.forEach(m => {
        const islandId = IslandSvc.xuid2Id(m.xuid);
        const tag = islandId ? "§a[有岛]" : "§7[无岛]";
        form.addButton(`${m.name}\n${tag}`);
        actions.push({ kind: "pick", info: m });
    });
    if (page > 0) {
        form.addButton(i18n.tr("admin.island.list.btn.prev"));
        actions.push({ kind: "prev" });
    }
    if (page < totalPages - 1) {
        form.addButton(i18n.tr("admin.island.list.btn.next"));
        actions.push({ kind: "next" });
    }

    player.sendForm(form, (p, btn) => {
        if (btn == null) return;
        const a = actions[btn];
        if (!a) return;
        if (a.kind === "search") return openPlayerSearchPrompt(p, search);
        if (a.kind === "prev") return openPlayerListGui(p, page - 1, search);
        if (a.kind === "next") return openPlayerListGui(p, page + 1, search);
        if (a.kind === "pick") return openPlayerAction(p, a.info.xuid, a.info.name);
    });
}


function openPlayerSearchPrompt(player, currentSearch = "") {
    const form = mc.newCustomForm()
        .setTitle(i18n.tr("admin.player.search.title"))
        .addInput(i18n.tr("admin.player.search.label"), "", currentSearch);

    player.sendForm(form, (p, res) => {
        if (res == null) return;
        const q = (res[0] || "").trim();
        openPlayerListGui(p, 0, q);
    });
}


export function openPlayerAction(player, xuid, name) {
    const islandId = IslandSvc.xuid2Id(xuid);
    const delCount = IslandSvc.getDelCount(xuid);

    const form = mc.newSimpleForm().setTitle(i18n.tr("admin.player.action.title", { name }));

    let body;
    if (islandId) {
        const isl = IslandSvc.getById(islandId);
        const ownerName = data.xuid2name(isl.owner) ?? isl.owner;
        const isOwner = isl.owner === xuid;
        body = i18n.tr("admin.player.action.body_with_island", {
            name, xuid,
            island: isl.name, ownerName,
            role: isOwner ? i18n.tr("admin.player.role.owner") : i18n.tr("admin.player.role.member"),
            delCount,
        });
    } else {
        body = i18n.tr("admin.player.action.body_no_island", { name, xuid, delCount });
    }
    form.setContent(body);

    const actions = [];
    form.addButton(i18n.tr("admin.player.action.btn.reset_del"));
    actions.push({ kind: "reset_del" });

    if (islandId) {
        const isl = IslandSvc.getById(islandId);
        form.addButton(i18n.tr("admin.player.action.btn.tp_island"));
        actions.push({ kind: "tp_island" });
        form.addButton(i18n.tr("admin.player.action.btn.open_island"));
        actions.push({ kind: "open_island" });
        if (isl.owner !== xuid) {
            form.addButton(i18n.tr("admin.player.action.btn.force_owner"));
            actions.push({ kind: "force_owner" });
            form.addButton(i18n.tr("admin.player.action.btn.force_kick"));
            actions.push({ kind: "force_kick" });
        }
    }

    player.sendForm(form, (p, btn) => {
        if (btn == null) return;
        const a = actions[btn];
        if (!a) return;
        switch (a.kind) {
            case "reset_del": return resetDel(p, xuid, name);
            case "tp_island": return tpToPlayerIsland(p, xuid);
            case "open_island": return openIslandDetail(p, islandId);
            case "force_owner": return forceOwner(p, islandId, xuid, name);
            case "force_kick": return forceKick(p, islandId, xuid, name);
        }
    });
}


function resetDel(player, xuid, name) {
    const r = island.resetDelCount(xuid);
    if (!r.ok) return player.sendMsg(i18n.tr(`admin.player.reset_del.${r.code}`, { name }));
    player.sendMsg(i18n.tr("admin.player.reset_del.done", { name }));
}


function tpToPlayerIsland(player, xuid) {
    const islandId = IslandSvc.xuid2Id(xuid);
    if (!islandId) return player.sendMsg(i18n.tr("admin.player.tp.no_island"));
    const isl = IslandSvc.getById(islandId);
    const sp = isl.members[isl.owner]?.spawn;
    if (!sp) return player.sendMsg(i18n.tr("admin.island.tp.no_spawn"));
    player.teleport(...sp);
    player.sendMsg(i18n.tr("admin.island.tp.done", { name: isl.name }));
}


function forceOwner(player, islandId, xuid, name) {

    player.sendModalForm(i18n.tr("admin.player.force_owner.confirm_title"), i18n.tr("admin.player.force_owner.confirm_body", { name }), i18n.tr("common.confirm"), i18n.tr("common.cancel"), (p, ok) => {
        if (!ok) return;
        const r = island.transfer(islandId, xuid, name);
        if (!r.ok) return p.sendMsg(i18n.tr(`admin.player.force_owner.fail.${r.code}`));
        p.sendMsg(i18n.tr("admin.player.force_owner.done", { name }));
        mc.getPlayer(xuid)?.sendMsg(i18n.tr("admin.player.force_owner.received"));
    });

}


function forceKick(player, islandId, xuid, name) {
    const r = island.removeMember(islandId, xuid);
    if (!r.ok) return player.sendMsg(i18n.tr(`admin.player.force_kick.fail.${r.code}`));
    const respawn = config.get("respawn");
    mc.getPlayer(xuid)?.teleport(...respawn);
    mc.getPlayer(xuid)?.sendMsg(i18n.tr("cmd.kick.notice"));
    player.sendMsg(i18n.tr("admin.player.force_kick.done", { name }));
}


/** 从岛屿成员列表跳过来 */
export function openPlayerActionFromIsland(player, xuid, _islandId) {
    const name = data.xuid2name(xuid) ?? xuid;
    openPlayerAction(player, xuid, name);
}

/**
 * 岛屿管理 GUI:列表/搜索/翻页/详情/扩缩/强删/成员
 */

import { IslandSvc } from "plugins/skyblock/src/services/IslandService.js";
import { island } from "plugins/skyblock/src/api/island.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { config } from "plugins/skyblock/src/core/Config.js";
import { L } from "plugins/skyblock/src/core/Logger.js";
import { enterByIslandId } from "plugins/skyblock/src/modules/admin/sudo.js";
import { openPlayerActionFromIsland } from "plugins/skyblock/src/modules/admin/player-mgr.js";

const log = L("AdminIsland");
const PAGE_SIZE = 8;


export function openIslandListGui(player, page = 0, search = "") {
    const allMap = IslandSvc.listByKind("normal");
    let entries = Object.entries(allMap);

    if (search) {
        const q = search.toLowerCase();
        entries = entries.filter(([id, isl]) => {
            const ownerName = (data.xuid2name(isl.owner) ?? "").toLowerCase();
            return (isl.name ?? "").toLowerCase().includes(q) || ownerName.includes(q);
        });
    }

    const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
    if (page >= totalPages) page = totalPages - 1;
    if (page < 0) page = 0;
    const pageEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const form = mc.newSimpleForm()
        .setTitle(i18n.tr("admin.island.list.title", { page: page + 1, total: totalPages }))
        .setContent(i18n.tr("admin.island.list.tip", {
            count: entries.length,
            search: search || i18n.tr("admin.island.list.no_search"),
        }));

    // 按钮顺序:搜索 / 岛屿列表 / 上一页 / 下一页
    const actions = [];
    form.addButton(i18n.tr("admin.island.list.btn.search"));
    actions.push({ kind: "search" });
    pageEntries.forEach(([id, isl]) => {
        const ownerName = data.xuid2name(isl.owner) ?? "(?)";
        const memberCnt = Object.keys(isl.members).length;
        form.addButton(`${isl.name} - ${memberCnt} 人\n§3${ownerName}`);
        actions.push({ kind: "island", id });
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
        switch (a.kind) {
            case "search": return openSearchPrompt(p);
            case "prev": return openIslandListGui(p, page - 1, search);
            case "next": return openIslandListGui(p, page + 1, search);
            case "island": return openIslandDetail(p, a.id);
        }
    });
}


function openSearchPrompt(player) {
    const form = mc.newCustomForm()
        .setTitle(i18n.tr("admin.island.list.search_title"))
        .addInput(i18n.tr("admin.island.list.search_label"), "");
    player.sendForm(form, (p, res) => {
        if (res == null) return;
        openIslandListGui(p, 0, (res[0] || "").trim());
    });
}


export function openIslandDetail(player, islandId) {
    const isl = IslandSvc.getById(islandId);
    if (!isl) return player.sendMsg(i18n.tr("admin.island.detail.no_island"));

    const ownerName = data.xuid2name(isl.owner) ?? isl.owner;
    const sizeX = isl.range.max[0] - isl.range.min[0] + 1;
    const sizeZ = isl.range.max[1] - isl.range.min[1] + 1;
    const memberCnt = Object.keys(isl.members).length;

    const form = mc.newSimpleForm()
        .setTitle(i18n.tr("admin.island.detail.title", { name: isl.name }))
        .setContent(i18n.tr("admin.island.detail.body", {
            name: isl.name,
            owner: ownerName,
            size: `${sizeX}x${sizeZ}`,
            members: memberCnt,
            id: islandId,
        }))
        .addButton(i18n.tr("admin.island.detail.btn.tp"))       // 0
        .addButton(i18n.tr("admin.island.detail.btn.delete"))   // 1
        .addButton(i18n.tr("admin.island.detail.btn.sudo"))     // 2
        .addButton(i18n.tr("admin.island.detail.btn.expand"))   // 3
        .addButton(i18n.tr("admin.island.detail.btn.shrink"))   // 4
        .addButton(i18n.tr("admin.island.detail.btn.members")); // 5

    player.sendForm(form, (p, btn) => {
        if (btn == null) return;
        switch (btn) {
            case 0: return tpToIsland(p, islandId);
            case 1: return forceDeleteIsland(p, islandId);
            case 2: return enterByIslandId(p, islandId);
            case 3: return openResizeGui(p, islandId, "expand");
            case 4: return openResizeGui(p, islandId, "shrink");
            case 5: return openMembersGui(p, islandId);
        }
    });
}


function tpToIsland(player, islandId) {
    const isl = IslandSvc.getById(islandId);
    if (!isl) return;
    const sp = isl.members[isl.owner]?.spawn;
    if (!sp) return player.sendMsg(i18n.tr("admin.island.tp.no_spawn"));
    player.teleport(...sp);
    player.sendMsg(i18n.tr("admin.island.tp.done", { name: isl.name }));
}


function forceDeleteIsland(player, islandId) {
    const isl = IslandSvc.getById(islandId);
    if (!isl) return;

    player.sendModalForm(i18n.tr("admin.island.del.confirm_title"), i18n.tr("admin.island.del.confirm_body", { name: isl.name }), i18n.tr("common.confirm"), i18n.tr("common.cancel"), (p, ok) => {
        if (!ok) return;
        const r = island.removeIsland(islandId, { countReset: false });
        if (!r.ok) return p.sendMsg(i18n.tr("admin.island.del.fail"));
        const respawn = config.get("respawn");
        for (const xuid of r.members) {
            mc.getPlayer(xuid)?.teleport(...respawn);
        }
        p.sendMsg(i18n.tr("admin.island.del.done", { name: isl.name }));
    });
}


export function openResizeGui(player, islandId, direction) {
    const isl = IslandSvc.getById(islandId);
    if (!isl) return;
    const curSize = isl.range.max[0] - isl.range.min[0] + 1;

    const form = mc.newCustomForm()
        .setTitle(i18n.tr(`admin.island.resize.${direction}_title`))
        .addLabel(i18n.tr("admin.island.resize.label", { current: curSize }))
        .addInput(i18n.tr(`admin.island.resize.input_${direction}`), "10");

    player.sendForm(form, (p, res) => {
        if (res == null) return;
        const amount = parseInt(res[1]);
        if (!Number.isFinite(amount) || amount <= 0) {
            return p.sendMsg(i18n.tr("admin.island.resize.invalid"));
        }
        const r = direction === "expand"
            ? island.expand(islandId, amount)
            : island.shrink(islandId, amount);
        if (!r.ok) {
            if (r.code === "conflict") {
                const conflictName = IslandSvc.getName(r.conflictId) ?? r.conflictId;
                return p.sendMsg(i18n.tr("admin.island.resize.conflict", { name: conflictName }));
            }
            return p.sendMsg(i18n.tr(`admin.island.resize.fail.${r.code}`));
        }
        p.sendMsg(i18n.tr(`admin.island.resize.${direction}_done`, { amount, size: r.newRange ? (r.newRange.max[0] - r.newRange.min[0] + 1) : "?" }));
    });
}


function openMembersGui(player, islandId) {
    const isl = IslandSvc.getById(islandId);
    if (!isl) return;
    const memberXuids = Object.keys(isl.members);

    const memberInfos = memberXuids.map(x => ({
        xuid: x,
        name: data.xuid2name(x) ?? x,
        isOwner: x === isl.owner,
    }));

    const form = mc.newSimpleForm().setTitle(i18n.tr("admin.island.members.title", { name: isl.name }));
    memberInfos.forEach(m => {
        const tag = m.isOwner ? "§6[岛主]" : "§3[成员]";
        form.addButton(`${m.name}\n${tag}`);
    });

    player.sendForm(form, (p, btn) => {
        if (btn == null) return;
        const m = memberInfos[btn];
        openPlayerActionFromIsland(p, m.xuid, islandId);
    });
}


/**
 * /isa expand <玩家名> <格数>  /  /isa shrink <玩家名> <格数>
 */
export function handleExpandShrink(player, name, direction, amount) {
    if (!name || amount == null) return player.sendMsg(i18n.tr(`admin.expand.usage_${direction}`));
    if (!Number.isFinite(amount) || amount <= 0) return player.sendMsg(i18n.tr("admin.expand.invalid_amount"));

    const xuid = data.name2xuid(name);
    if (!xuid) return player.sendMsg(i18n.tr("admin.expand.no_player", { name }));
    const islandId = IslandSvc.xuid2Id(xuid);
    if (!islandId) return player.sendMsg(i18n.tr("admin.expand.no_island", { name }));

    const r = direction === "expand"
        ? island.expand(islandId, amount)
        : island.shrink(islandId, amount);

    if (!r.ok) {
        if (r.code === "conflict") {
            const conflictName = IslandSvc.getName(r.conflictId) ?? r.conflictId;
            return player.sendMsg(i18n.tr("admin.island.resize.conflict", { name: conflictName }));
        }
        return player.sendMsg(i18n.tr(`admin.island.resize.fail.${r.code}`));
    }
    player.sendMsg(i18n.tr(`admin.expand.${direction}_done`, { name, amount }));
}

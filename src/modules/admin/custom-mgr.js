/**
 * 自定义岛屿管理:创建 / 列表 / 详情(传送/扩缩/删除)
 */

import { IslandSvc } from "plugins/skyblock/src/services/IslandService.js";
import { island } from "plugins/skyblock/src/api/island.js";
import { config } from "plugins/skyblock/src/core/Config.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { CONST } from "plugins/skyblock/src/core/constants.js";
import { Timer } from "plugins/skyblock/src/core/Timer.js";
import { L } from "plugins/skyblock/src/core/Logger.js";
import { openResizeGui } from "plugins/skyblock/src/modules/admin/island-mgr.js";

const log = L("AdminCustom");
const PAGE_SIZE = 8;


export function openCustomCreateGui(player) {
    const templates = config.get("templates");
    const form = mc.newCustomForm()
        .setTitle(i18n.tr("admin.custom.create.title"))
        .addInput(i18n.tr("admin.custom.create.name_label"), "")
        .addDropdown(i18n.tr("admin.custom.create.template_label"), templates.map(t => t.name), 0);

    player.sendForm(form, (p, res) => {
        if (res == null) return;
        const name = (res[0] || "").trim();
        if (!name) return p.sendMsg(i18n.tr("admin.custom.create.no_name"));
        if (name.length > 32) return p.sendMsg(i18n.tr("admin.custom.create.name_too_long"));
        const tpl = templates[res[1]];
        if (!tpl) return p.sendMsg(i18n.tr("admin.custom.create.no_template"));

        const r = island.createCustom(p.xuid, name, tpl);
        if (!r.ok) return p.sendMsg(i18n.tr(`admin.custom.create.fail.${r.code}`));

        // 默认流程:传送到模板位置 + 等区块加载后 paste 结构
        const spawnPos = new IntPos(...r.spawn, CONST.DIM_OVERWORLD);
        const { file, loadPosX, loadPosY, loadPosZ } = r.loadInfo;
        p.teleport(spawnPos);

        Timer.start(`isa-create:${p.xuid}`, () => {
            if (mc.getBlock(spawnPos) == null) return;
            mc.runcmdEx(`structure load ${file} ${loadPosX} ${loadPosY} ${loadPosZ}`);
            p.teleport(spawnPos);
            p.sendMsg(i18n.tr("admin.custom.create.done", { name }));
            Timer.stop(`isa-create:${p.xuid}`);
        }, CONST.CHUNK_LOAD_POLL_MS);
    });
}


export function openCustomListGui(player, page = 0) {
    const all = IslandSvc.listByKind("custom");
    const entries = Object.entries(all);

    if (entries.length === 0) return player.sendMsg(i18n.tr("admin.custom.list.empty"));

    const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
    if (page >= totalPages) page = totalPages - 1;
    if (page < 0) page = 0;
    const pageEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const form = mc.newSimpleForm()
        .setTitle(i18n.tr("admin.custom.list.title", {
            count: entries.length, page: page + 1, total: totalPages,
        }));

    const actions = [];
    if (page > 0) {
        form.addButton(i18n.tr("admin.island.list.btn.prev"));
        actions.push({ kind: "prev" });
    }
    if (page < totalPages - 1) {
        form.addButton(i18n.tr("admin.island.list.btn.next"));
        actions.push({ kind: "next" });
    }
    pageEntries.forEach(([id, isl]) => {
        const sizeX = isl.range.max[0] - isl.range.min[0] + 1;
        const sizeZ = isl.range.max[1] - isl.range.min[1] + 1;
        form.addButton(`${isl.name}\n§7${sizeX}x${sizeZ}`);
        actions.push({ kind: "detail", id });
    });

    player.sendForm(form, (p, btn) => {
        if (btn == null) return;
        const a = actions[btn];
        if (!a) return;
        if (a.kind === "prev") return openCustomListGui(p, page - 1);
        if (a.kind === "next") return openCustomListGui(p, page + 1);
        if (a.kind === "detail") return openCustomDetail(p, a.id);
    });
}


function openCustomDetail(player, islandId) {
    const isl = IslandSvc.getById(islandId);
    if (!isl) return;
    const sizeX = isl.range.max[0] - isl.range.min[0] + 1;
    const sizeZ = isl.range.max[1] - isl.range.min[1] + 1;

    const form = mc.newSimpleForm()
        .setTitle(i18n.tr("admin.custom.detail.title", { name: isl.name }))
        .setContent(i18n.tr("admin.custom.detail.body", {
            name: isl.name,
            id: islandId,
            size: `${sizeX}x${sizeZ}`,
            min: `${isl.range.min[0]},${isl.range.min[1]}`,
            max: `${isl.range.max[0]},${isl.range.max[1]}`,
        }))
        .addButton(i18n.tr("admin.custom.detail.btn.tp"))         // 0
        .addButton(i18n.tr("admin.custom.detail.btn.set_spawn"))  // 1
        .addButton(i18n.tr("admin.custom.detail.btn.expand"))     // 2
        .addButton(i18n.tr("admin.custom.detail.btn.shrink"))     // 3
        .addButton(i18n.tr("admin.custom.detail.btn.delete"));    // 4

    player.sendForm(form, (p, btn) => {
        if (btn == null) return;
        switch (btn) {
            case 0: {
                // 自定义岛屿:优先用顶层 spawn,fallback 老逻辑
                const sp = isl.spawn || isl.members[isl.owner]?.spawn;
                if (sp) p.teleport(...sp);
                return;
            }
            case 1: return setCustomSpawn(p, islandId);
            case 2: return openResizeGui(p, islandId, "expand");
            case 3: return openResizeGui(p, islandId, "shrink");
            case 4: {
                p.sendModalForm(i18n.tr("admin.island.del.confirm_title"), i18n.tr("admin.island.del.confirm_body", { name: isl.name }), i18n.tr("common.confirm"), i18n.tr("common.cancel"), (p2, ok) => {
                    if (!ok) return;
                    const r = island.removeIsland(islandId, { countReset: false });
                    if (!r.ok) return p2.sendMsg(i18n.tr("admin.island.del.fail"));
                    p2.sendMsg(i18n.tr("admin.island.del.done", { name: isl.name }));
                });
                return;
            }
        }
    });
}

// 设置出生点
function setCustomSpawn(player, islandId) {
    const pos = player.pos;
    if (pos.dimid !== CONST.DIM_OVERWORLD) {
        return player.sendMsg(i18n.tr("admin.custom.set_spawn.overworld_only"));
    }
    const spawn = [Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z), pos.dimid];
    const r = island.setIslandSpawn(islandId, spawn);
    if (!r.ok) return player.sendMsg(i18n.tr(`admin.custom.set_spawn.fail.${r.code}`));
    player.sendMsg(i18n.tr("admin.custom.set_spawn.done", {
        x: spawn[0], y: spawn[1], z: spawn[2],
    }));
}

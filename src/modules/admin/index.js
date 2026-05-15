/**
 * /isa 命令入口 + 主菜单 GUI
 *
 */

import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { L } from "plugins/skyblock/src/core/Logger.js";

import { handleSudo, handleSudoExit } from "plugins/skyblock/src/modules/admin/sudo.js";
import { handleAdmin } from "plugins/skyblock/src/modules/admin/admin-mgr.js";
import { openIslandListGui, openIslandDetail, handleExpandShrink } from "plugins/skyblock/src/modules/admin/island-mgr.js";
import { openPlayerListGui } from "plugins/skyblock/src/modules/admin/player-mgr.js";
import { openCustomListGui, openCustomCreateGui } from "plugins/skyblock/src/modules/admin/custom-mgr.js";

const log = L("isa");


function ensureAdmin(player) {
    if (!player.isAdmin) {
        player.sendMsg(i18n.tr("admin.no_permission"));
        return false;
    }
    return true;
}


function openMainGui(player) {
    if (!ensureAdmin(player)) return;

    const form = mc.newSimpleForm()
        .setTitle(i18n.tr("admin.main.title"))
        .setContent(i18n.tr("admin.main.tip"))
        .addButton(i18n.tr("admin.main.btn.island"))     // 0
        .addButton(i18n.tr("admin.main.btn.player"))     // 1
        .addButton(i18n.tr("admin.main.btn.custom"))     // 2
        .addButton(i18n.tr("admin.main.btn.sudo_here"))  // 3
        .addButton(i18n.tr("admin.main.btn.reload"));    // 4

    player.sendForm(form, (p, id) => {
        if (id == null) return;
        switch (id) {
            case 0: return openIslandListGui(p);
            case 1: return openPlayerListGui(p);
            case 2: return openCustomMenuGui(p);
            case 3: return handleSudo(p, null);
            case 4: return handleReload(p);
        }
    });
}


function openCustomMenuGui(player) {
    const form = mc.newSimpleForm()
        .setTitle(i18n.tr("admin.custom.title"))
        .addButton(i18n.tr("admin.custom.btn.create"))
        .addButton(i18n.tr("admin.custom.btn.list"));
    player.sendForm(form, (p, id) => {
        if (id == null) return;
        if (id === 0) return openCustomCreateGui(p);
        if (id === 1) return openCustomListGui(p);
    });
}


function handleReload(player) {
    player.sendMsg(i18n.tr("暂时弃用, 请重启服务器以加载最新配置 或者 手动在后台执行 ll reload skyblock"));
}


function openHereIsland(player) {
    const islandId = player.currentIslandId;
    if (!islandId) return player.sendMsg(i18n.tr("admin.here.not_on_island"));
    openIslandDetail(player, islandId);
}


export function setupAdminCommand() {
    const cmd = mc.newCommand("isa", "SkyBlock Admin", PermType.Any);

    const subs = ["sudo", "expand", "shrink", "reload", "admin", "create", "here"];
    for (const s of subs) {
        cmd.setEnum(`isa_${s}`, [s]);
        cmd.mandatory(`isa_${s}`, ParamType.Enum, `isa_${s}`, `isa_${s}`, 1);
    }

    // admin 二级子命令
    cmd.setEnum("admin_sub", ["add", "del", "list"]);
    cmd.mandatory("admin_sub", ParamType.Enum, "admin_sub", "admin_sub", 1);

    // sudo 的 exit 关键字
    cmd.setEnum("sudo_exit", ["exit"]);
    cmd.mandatory("sudo_exit", ParamType.Enum, "sudo_exit", "sudo_exit", 1);

    // 通用参数
    cmd.optional("isa_player", ParamType.String);
    cmd.optional("isa_amount", ParamType.Int);
    cmd.optional("isa_name", ParamType.String);

    // overloads
    cmd.overload([]);                                            // /isa
    cmd.overload(["isa_sudo"]);                                  // /isa sudo
    cmd.overload(["isa_sudo", "sudo_exit"]);                     // /isa sudo exit
    cmd.overload(["isa_sudo", "isa_player"]);                    // /isa sudo <player>
    cmd.overload(["isa_expand", "isa_player", "isa_amount"]);    // /isa expand <player> <格数>
    cmd.overload(["isa_shrink", "isa_player", "isa_amount"]);    // /isa shrink <player> <格数>
    cmd.overload(["isa_reload"]);                                // /isa reload
    cmd.overload(["isa_admin", "admin_sub"]);                    // /isa admin list
    cmd.overload(["isa_admin", "admin_sub", "isa_name"]);        // /isa admin add <name>
    cmd.overload(["isa_create"]);                                // /isa create
    cmd.overload(["isa_here"]);                                  // /isa here

    cmd.setCallback((_cmd, origin, output, results) => {
        const player = origin.player;
        if (!player) { output.error("/isa 必须由玩家执行"); return; }

        if (results.isa_admin !== undefined) {

            if (!player.isOP()) return output.error("你没有权限执行这个命令");

            return handleAdmin(player, results.admin_sub, results.isa_name)
        }

        if (!ensureAdmin(player)) return;

        try {
            if (results.isa_sudo !== undefined) {
                if (results.sudo_exit !== undefined) return handleSudoExit(player);
                if (results.isa_player === "exit") return handleSudoExit(player);
                return handleSudo(player, results.isa_player ?? null);
            }
            if (results.isa_expand !== undefined) return handleExpandShrink(player, results.isa_player, "expand", results.isa_amount);
            if (results.isa_shrink !== undefined) return handleExpandShrink(player, results.isa_player, "shrink", results.isa_amount);
            if (results.isa_reload !== undefined) return handleReload(player);
            if (results.isa_create !== undefined) return openCustomCreateGui(player);
            if (results.isa_here !== undefined) return openHereIsland(player);
            // 不带子命令
            return openMainGui(player);
        } catch (e) {
            log.error("/isa 抛错:", e);
        }
    });
    cmd.setup();
}

export { openMainGui, openCustomMenuGui };

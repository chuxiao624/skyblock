
import { Command } from "plugins/skyblock/src/core/Command.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { perms } from "plugins/skyblock/src/api/perms.js";
import { L } from "plugins/skyblock/src/core/Logger.js";

const log = L("Cmd:perm");


function openPermGui(player) {
    if (!player.guardOwner() || !player.guardInIsland()) return;
    const islandId = player.islandId;

    const dt = perms.get(islandId);
    if (!dt) return player.sendMsg(i18n.tr("perm.load_fail"));

    const form = mc.newCustomForm().setTitle(i18n.tr("perm.edit_title"));

    const defKeys = Object.keys(dt.defaults);
    const evtKeys = Object.keys(dt.events);

    form.addLabel(i18n.tr("perm.section.defaults"));
    for (const k of defKeys) form.addSwitch(i18n.tr(`permission.${k}`), dt.defaults[k]);

    form.addLabel(i18n.tr("perm.section.events"));
    for (const k of evtKeys) form.addSwitch(i18n.tr(`events.${k}`), dt.events[k]);

    player.sendForm(form, (p, res) => {
        if (res == null) return;
        // 二次校验玩家是否还是岛主(表单期间可能被踢)
        if (p.islandId !== islandId) return;

        let i = 1;  // label 占索引 0
        const newDef = {};
        for (const k of defKeys) newDef[k] = res[i++];
        i++;        // 跳过第二个 label
        const newEvt = {};
        for (const k of evtKeys) newEvt[k] = res[i++];

        perms.setDefaults(islandId, newDef);
        perms.setEvents(islandId, newEvt);
        p.sendMsg(i18n.tr("perm.saved"));
    });
}

function modifyPerm(player, target, node, action) {
    if (!player.guardOwner() || !player.guardInIsland()) return;

    const islandId = player.islandId;
    const island = perms.get(islandId);
    if (!island.defaults.hasOwnProperty(node)) {
        return player.sendMsg(i18n.tr("perm.invalid_node"));
    }

    const info = data.fromName(target);
    if (!info?.xuid) return player.sendMsg(i18n.tr("perm.no_player"));
    const xuid = info.xuid;

    if (player.islandMembers?.[xuid]) {
        return player.sendMsg(i18n.tr("perm.cant_be_member"));
    }

    if (action === "add") {
        if (island.allowlist?.[xuid]?.includes(node)) {
            return player.sendMsg(i18n.tr("perm.already_has"));
        }
        perms.addPermToPlayer(islandId, xuid, node);
        player.sendMsg(i18n.tr("perm.added", { name: target, node }));
    } else {
        if (!island.allowlist?.[xuid]?.includes(node)) {
            return player.sendMsg(i18n.tr("perm.not_has"));
        }
        perms.removePermFromPlayer(islandId, xuid, node);
        player.sendMsg(i18n.tr("perm.removed", { name: target, node }));
    }
}


function openAllowlistGui(player) {
    if (!player.guardOwner() || !player.guardInIsland()) return;
    const islandId = player.islandId;

    const allowlist = perms.get(islandId, "allowlist") ?? {};
    const allNodes = Object.keys(perms.get(islandId, "defaults"));

    const xuids = Object.keys(allowlist);
    if (xuids.length === 0) return player.sendMsg(i18n.tr("perm.allowlist_empty"));

    const playerForm = mc.newSimpleForm().setTitle(i18n.tr("perm.allowlist_title"));
    for (const xuid of xuids) {
        const name = data.xuid2name(xuid) ?? xuid;
        const cnt = allowlist[xuid].length;
        playerForm.addButton(`${name}\n§3${cnt} 个权限`);
    }

    player.sendForm(playerForm, (p, id) => {
        if (id == null) return;
        const xuid = xuids[id];
        openPlayerPermGuiByXuid(p, xuid);
    });
}


function openPlayerPermGui(player, targetName) {
    if (!player.guardOwner() || !player.guardInIsland()) return;
    const xuid = data.name2xuid(targetName);
    if (!xuid) return player.sendMsg(i18n.tr("perm.no_player"));
    openPlayerPermGuiByXuid(player, xuid);
}

function openPlayerPermGuiByXuid(player, xuid) {
    const islandId = player.islandId;
    const allowlist = perms.get(islandId, "allowlist") ?? {};
    const allNodes = Object.keys(perms.get(islandId, "defaults"));

    const targetName = data.xuid2name(xuid) ?? xuid;
    const cur = allowlist[xuid] ?? [];

    const form = mc.newCustomForm().setTitle(i18n.tr("perm.player_title", { name: targetName }));
    for (const node of allNodes) form.addSwitch(i18n.tr(`permission.${node}`), cur.includes(node));

    player.sendForm(form, (p, res) => {
        if (res == null) return;
        if (p.islandId !== islandId) return;
        const newPerms = allNodes.filter((_, i) => res[i]);
        perms.setPlayerPerms(islandId, xuid, newPerms);
        p.sendMsg(i18n.tr("perm.player_updated", { name: targetName }));
    });
}

// 使用指南针蹲下 攻击 某个玩家
mc.listen("onAttackEntity", (player, entity) => {
    if (!player.isSneaking) return;
    if (player.getHand().type !== "minecraft:compass") return;
    if (!entity.isPlayer()) return;
    if (!player.isIslandOwner) return;
    openPlayerPermGui(player, entity.toPlayer().realName);
    return false;
});


Command.registerAll({
    "perm": {
        enums: { perm_action: ["edit", "add", "remove", "allowlist"] },
        params: {
            perm_target: { type: ParamType.String, optional: true },
            perm_node: { type: ParamType.String, optional: true },
        },
        overloads: [
            ["perm_action"],
            ["perm_action", "perm_target"],
            ["perm_action", "perm_target", "perm_node"],
        ],
        callback: (origin, output, results) => {
            const p = origin.player; if (!p) return;
            switch (results.perm_action) {
                case "edit": return openPermGui(p);
                case "allowlist":
                    if (results.perm_target) return openPlayerPermGui(p, results.perm_target);
                    return openAllowlistGui(p);
                case "add": return modifyPerm(p, results.perm_target, results.perm_node, "add");
                case "remove": return modifyPerm(p, results.perm_target, results.perm_node, "remove");
            }
        }
    }
});

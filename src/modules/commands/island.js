
import { Event } from "plugins/skyblock/src/core/EventBus.js";
import { Session } from "plugins/skyblock/src/core/Session.js";
import { Timer } from "plugins/skyblock/src/core/Timer.js";
import { Command } from "plugins/skyblock/src/core/Command.js";
import { Store } from "plugins/skyblock/src/core/Store.js";
import { config } from "plugins/skyblock/src/core/Config.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { CONST } from "plugins/skyblock/src/core/constants.js";
import { L } from "plugins/skyblock/src/core/Logger.js";

import { island } from "plugins/skyblock/src/api/island.js";
import { AdminProxySvc } from "plugins/skyblock/src/services/AdminProxyService.js";

const log = L("Cmd:island");

function createIsland(player) {
    if (AdminProxySvc.isInProxy(player.xuid)) return player.sendMsg(i18n.tr("cmd.create.in_proxy"));
    if (player.islandId) return player.sendMsg(i18n.tr("cmd.create.already_have"));

    const form = mc.newSimpleForm().setTitle(i18n.tr("cmd.create.title"));
    const templates = config.get("templates");
    templates.forEach(t => form.addButton(`${t.name}\n§c${t.description}`));

    player.sendForm(form, (player, id) => {
        if (id == null) return;

        const r = island.createIsland(player.xuid, player.realName, templates[id]);
        if (!r.ok) return player.sendMsg(i18n.tr("cmd.create.fail", { code: r.code }));

        const spawnPos = new IntPos(...r.spawn, CONST.DIM_OVERWORLD);
        const { file, loadPosX, loadPosY, loadPosZ } = r.loadInfo;

        // 把玩家传送过去触发区块加载
        player.teleport(spawnPos);

        // 等待区块加载完成  再 structure load 
        // 5.6 经过测试 , structure load 非常强大 使用 structure load xxx  会加入队列 此时重启服务器 玩家再次进入 仍旧会加载
        Timer.start(`create:${player.xuid}`, () => {
            if (mc.getBlock(spawnPos) == null) return;
            mc.runcmdEx(`structure load ${file} ${loadPosX} ${loadPosY} ${loadPosZ}`);
            player.teleport(spawnPos);
            player.setRespawnPosition(spawnPos);
            player.sendMsg(i18n.tr("cmd.create.success"));
            Timer.stop(`create:${player.xuid}`);
        }, CONST.CHUNK_LOAD_POLL_MS);
    });
}


function disbandIsland(player) {
    if (!player.guardOwner()) return;

    const inProxy = AdminProxySvc.isInProxy(player.xuid);

    if (!inProxy && island.getDelCount(player.xuid) >= config.get("reset_limit")) {
        return player.sendMsg(i18n.tr("cmd.disband.limit"));
    }

    if (Session.has("disband", player.xuid)) {
        const islandId = Session.get("disband", player.xuid);
        const r = island.removeIsland(islandId, inProxy ? { countReset: false } : {});
        if (!r.ok) return player.sendMsg(i18n.tr("cmd.disband.fail"));

        player.setRespawnPosition(...config.get("respawn"));
        player.sendMsg(i18n.tr(inProxy ? "cmd.disband.proxy_done" : "cmd.disband.done"));

        // 把所有原成员送回主城
        const respawn = config.get("respawn");
        for (const xuid of r.members) {
            mc.getPlayer(xuid)?.teleport(...respawn);
        }
        Session.del("disband", player.xuid);

        // 代理状态下,被代理岛已经没了,自动 exit
        if (inProxy) AdminProxySvc.exit(player.xuid);
        return;
    }

    Session.set("disband", player.xuid, player.islandId, CONST.DISBAND_CONFIRM_SEC);
    player.sendMsg(i18n.tr("cmd.disband.confirm", { sec: CONST.DISBAND_CONFIRM_SEC }));
}


function spawnIsland(player) {
    if (!player.guardIsland()) return;
    const sp = player.islandSpawn;
    if (!sp) return player.sendMsg(i18n.tr("cmd.spawn.not_set"));
    player.teleport(...sp);
}


function setSpawnIsland(player) {
    if (!player.guardIsland() || !player.guardInIsland()) return;
    const p = player.pos;
    if (p.dimid !== CONST.DIM_OVERWORLD) {
        return player.sendMsg(i18n.tr("cmd.setspawn.overworld_only"));
    }
    const r = island.setSpawn(player.islandId, player.xuid, [p.x, p.y, p.z, p.dimid]);
    if (r.ok) player.sendMsg(i18n.tr("cmd.setspawn.done"));
}


function infoIsland(player) {
    if (!player.guardIsland()) return;
    const d = player.island;
    const ownerName = data.xuid2name(d.owner) ?? d.owner;
    const sizeX = d.range.max[0] - d.range.min[0] + 1;
    const sizeZ = d.range.max[1] - d.range.min[1] + 1;
    const memberCnt = Object.keys(d.members).length;

    const form = mc.newSimpleForm()
        .setTitle(i18n.tr("cmd.info.title"))
        .setContent(i18n.tr("cmd.info.body", {
            name: d.name,
            owner: ownerName,
            size: `${sizeX}x${sizeZ}`,
            members: memberCnt,
        }))
        .addButton(i18n.tr("common.close"));
    player.sendForm(form, () => { });
}


function transferIsland(player) {
    if (!player.guardOwner()) return;

    const d = player.island;
    const memberXuids = Object.keys(d.members).filter(x => x !== d.owner);
    if (memberXuids.length === 0) return player.sendMsg(i18n.tr("cmd.transfer.no_member"));

    const memberInfos = memberXuids.map(x => ({ xuid: x, name: data.xuid2name(x) ?? x }));

    const form = mc.newSimpleForm().setTitle(i18n.tr("cmd.transfer.title"));
    form.setContent(i18n.tr("cmd.transfer.tip"));
    memberInfos.forEach(m => form.addButton(m.name));

    player.sendForm(form, (p, id) => {
        if (id == null) return;
        const m = memberInfos[id];
        p.sendModalForm(i18n.tr("cmd.transfer.confirm_title"), i18n.tr("cmd.transfer.confirm_body", { name: m.name }), i18n.tr("common.confirm"), i18n.tr("common.cancel"), (p2, ok) => {
            if (!ok) return;
            const r = island.transfer(p2.islandId, m.xuid, m.name);
            if (!r.ok) return p2.sendMsg(i18n.tr(`cmd.transfer.fail.${r.code}`));
            p2.sendMsg(i18n.tr("cmd.transfer.done", { name: m.name }));
            mc.getPlayer(m.xuid)?.sendMsg(i18n.tr("cmd.transfer.received", { name: p2.realName }));
        });

    });
}

const HELP_DEFAULT =
    "§e/is create §7- 创建岛屿\n" +
    "§e/is disband §7- 解散岛屿\n" +
    "§e/is spawn §7- 回到岛屿出生点\n" +
    "§e/is setspawn §7- 设置岛屿出生点(仅限自己岛上)\n" +
    "§e/is info §7- 查看当前岛屿信息\n" +
    "§e/is transfer §7- 转让岛主\n" +
    "§e/is invite §a<player> §7- 邀请玩家\n" +
    "§e/is invite accept §7- 接受邀请\n" +
    "§e/is invite refuse §7- 拒绝邀请\n" +
    "§e/is kick §a<player> §7- 踢出成员\n" +
    "§e/is leave §7- 离开当前岛屿\n" +
    "§e/is perm edit §7- 编辑岛屿默认权限\n" +
    "§e/is perm add §a<player> <node> §7- 添加白名单权限\n" +
    "§e/is perm remove §a<player> <node> §7- 移除白名单权限\n" +
    "§e/is perm allowlist §7- 管理白名单\n" +
    "§e/is perm allowlist §a<player> §7- 管理指定玩家";
Store.set("help", HELP_DEFAULT);

function helpCmd(player) {
    const head = "§7§m-----------§r §b§l空岛指令§r §7§m-----------§r\n";
    const tail = "\n§7§m-----------------------------§r";
    player.tell(head + Store.get("help") + tail);
}

Command.registerAll({
    "create": (origin) => createIsland(origin.player),
    "disband": (origin) => disbandIsland(origin.player),
    "spawn": (origin) => spawnIsland(origin.player),
    "setspawn": (origin) => setSpawnIsland(origin.player),
    "info": (origin) => infoIsland(origin.player),
    "transfer": (origin) => transferIsland(origin.player),
    "help": (origin) => helpCmd(origin.player),
});


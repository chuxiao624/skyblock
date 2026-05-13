

import { Command } from "plugins/skyblock/src/core/Command.js";
import { Session } from "plugins/skyblock/src/core/Session.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { config } from "plugins/skyblock/src/core/Config.js";
import { CONST } from "plugins/skyblock/src/core/constants.js";
import { island } from "plugins/skyblock/src/api/island.js";

function invitePlayer(player, targetName) {
    if (!player.guardOwner()) return;

    const memberCnt = Object.keys(player.islandMembers || {}).length;
    if (memberCnt >= config.get("member_limit")) {
        return player.sendMsg(i18n.tr("cmd.invite.full"));
    }

    const target = mc.getPlayer(targetName);
    if (!target) return player.sendMsg(i18n.tr("cmd.invite.offline", { name: targetName }));
    if (target.xuid === player.xuid) return player.sendMsg(i18n.tr("cmd.invite.self"));

    if (Session.has("invite", target.xuid)) {
        return player.sendMsg(i18n.tr("cmd.invite.already_sent", { name: targetName }));
    }

    Session.set("invite", target.xuid, player.xuid, CONST.INVITE_TIMEOUT_SEC);

    target.sendMsg(i18n.tr("cmd.invite.received", { name: player.realName }));
    player.sendMsg(i18n.tr("cmd.invite.sent", { name: targetName }));
}

function acceptInvite(player) {
    if (!Session.has("invite", player.xuid)) {
        return player.sendMsg(i18n.tr("cmd.invite.no_invite"));
    }
    const inviterXuid = Session.get("invite", player.xuid);
    const islandId = island.xuid2islandId(inviterXuid);
    if (!islandId) {
        Session.del("invite", player.xuid);
        return player.sendMsg(i18n.tr("cmd.invite.inviter_no_island"));
    }

    const r = island.addMember(islandId, player.xuid);
    Session.del("invite", player.xuid);

    if (!r.ok) return player.sendMsg(i18n.tr(`cmd.invite.fail.${r.code}`));

    const sp = player.islandSpawn;
    if (sp) {
        player.teleport(...sp);
        player.setRespawnPosition(...sp);
    }

    mc.getPlayer(inviterXuid)?.sendMsg(
        i18n.tr("cmd.invite.target_joined", { name: player.realName })
    );
    player.sendMsg(i18n.tr("cmd.invite.you_joined"));
}

function refuseInvite(player) {
    if (!Session.has("invite", player.xuid)) {
        return player.sendMsg(i18n.tr("cmd.invite.no_invite"));
    }
    const inviterXuid = Session.get("invite", player.xuid);
    Session.del("invite", player.xuid);
    mc.getPlayer(inviterXuid)?.sendMsg(
        i18n.tr("cmd.invite.target_refused", { name: player.realName })
    );
    player.sendMsg(i18n.tr("cmd.invite.you_refused"));
}

function kickMember(player, targetName) {
    if (!player.guardOwner()) return;

    const info = data.fromName(targetName);
    if (!info?.xuid) return player.sendMsg(i18n.tr("cmd.kick.no_player", { name: targetName }));
    const xuid = info.xuid;

    if (!player.islandMembers?.[xuid]) {
        return player.sendMsg(i18n.tr("cmd.kick.not_member", { name: targetName }));
    }

    const r = island.removeMember(player.islandId, xuid);
    if (!r.ok) return player.sendMsg(i18n.tr("cmd.kick.fail"));

    const respawn = config.get("respawn");
    mc.getPlayer(xuid)?.teleport(...respawn);
    mc.getPlayer(xuid)?.sendMsg(i18n.tr("cmd.kick.notice"));
    player.sendMsg(i18n.tr("cmd.kick.done", { name: targetName }));
}

function leaveIsland(player) {
    if (!player.guardIsland()) return;
    if (player.isIslandOwner) return player.sendMsg(i18n.tr("cmd.leave.is_owner"));

    const r = island.removeMember(player.islandId, player.xuid);
    if (!r.ok) return player.sendMsg(i18n.tr("cmd.leave.fail"));

    player.teleport(...config.get("respawn"));
    player.setRespawnPosition(...config.get("respawn"));
    player.sendMsg(i18n.tr("cmd.leave.done"));
}


Command.registerAll({
    "invite": {
        params: { invite_target: ParamType.String },
        overloads: [["invite_target"]],
        callback: (origin, output, results) => {
            switch (results.invite_target) {
                case "accept": return acceptInvite(origin.player);
                case "refuse": return refuseInvite(origin.player);
                default: return invitePlayer(origin.player, results.invite_target);
            }
        }
    },
    "kick": {
        params: { kick_target: ParamType.String },
        overloads: [["kick_target"]],
        callback: (origin, output, results) => kickMember(origin.player, results.kick_target),
    },
    "leave": (origin) => leaveIsland(origin.player),
});

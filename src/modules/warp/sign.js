/**
 * 
 *  第 1 行写 [传送点],第 2 行写名字 然后蹲下右键 注册一个传送点
 *  潜行右键 -> 改名
 *  破坏后通过坐标查找并清理数据
 */

import { WarpData } from "plugins/skyblock/src/modules/warp/repo.js";
import { openEditSignGui } from "plugins/skyblock/src/modules/warp/gui.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { Event } from "plugins/skyblock/src/core/EventBus.js";

const TAG = WarpData.CONFIG.signTag;
const ACTIVE = WarpData.CONFIG.activeMark + TAG + "§r";

Event.guard("onUseSignAfter", (player, block) => {
    const be = block.getBlockEntity();
    const nbt = be.getNbt();
    const frontText = nbt.getTag("FrontText").getTag("Text").toString();

    if (!frontText.includes(TAG)) return true;

    // 已激活
    if (frontText.includes(ACTIVE)) {
        if (player.isSneaking) openEditSignGui(player, block, be, nbt, frontText);
        return false;
    }

    if (!player.isOnOwnIsland) {
        player.sendMsg(i18n.tr("warp.not_on_own_island"));
        return false;
    }

    const lines = frontText.split("\n");
    const name = lines[1]?.trim();

    if (!WarpData.isValidName(name)) {
        player.sendMsg(i18n.tr("warp.no_name"));
        return true;
    }
    if (WarpData.get(player.islandId, name)) {
        player.sendMsg(i18n.tr("warp.already_exists"));
        return true;
    }
    if (WarpData.isOverLimit(player.islandId)) {
        player.sendMsg(i18n.tr("warp.over_limit", { max: WarpData.CONFIG.maxWarps }));
        return true;
    }

    WarpData.set(player.islandId, name, {
        x: block.pos.x, y: block.pos.y, z: block.pos.z, dimid: block.pos.dimid,
    });

    // 木牌染色 , 标记已激活
    const newText = frontText.replace(TAG, ACTIVE);
    nbt.getTag("FrontText").setString("Text", newText);
    be.setNbt(nbt);
    // 刷新
    player.refreshChunks();

    player.sendMsg(i18n.tr("warp.set_success", { name }));
    return false;
});

// 木牌被破坏 -> 清理数据
Event.on("onDestroySignAfter", (player, block) => {
    if (!player.islandId) return;
    const ok = WarpData.delByPos(player.islandId, {
        x: block.pos.x, y: block.pos.y, z: block.pos.z, dimid: block.pos.dimid,
    });
    if (ok) player.sendMsg(i18n.tr("warp.del_success"));
});

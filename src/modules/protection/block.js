
import { Event } from "plugins/skyblock/src/core/EventBus.js";
import { protect } from "plugins/skyblock/src/api/protect.js";
import { REGEX, ITEM_PERMS, BLOCK_PERMS } from "plugins/skyblock/src/modules/protection/rules.js";

// 把 LSE 事件转发到内部 EventBus 方便实现 例如 玩家在某个岛屿可以 破坏某个地方的方块 这种操作

mc.listen("onUseItemOn", (player, item, block, side, pos) => Event.check("onUseItemOn", player, item, block, side, pos));

mc.listen("onDestroyBlock", (player, block) => Event.check("onDestroyBlock", player, block));

mc.listen("onPlaceBlock", (player, block) => Event.check("onPlaceBlock", player, block));



Event.guard("onDestroyBlock", (player, block) => {
    const ok = protect.assertPerm(player, block.pos, "destroy_block");
    if (ok) {
        if (block.type.includes("_sign")) {

            Event.emit("onDestroySignAfter", player, block);

        }
    }
    return ok;
});


Event.guard("onPlaceBlock", (player, block) => {
    const itemType = player.getHand().type;
    if (REGEX.BUCKET.test(itemType)) {
        return protect.assertPerm(player, block.pos, "use_bucket");
    }
    return protect.assertPerm(player, block.pos, "place_block");
});


Event.guard("onUseItemOn", (player, item, block, side, pos) => {
    //  玩家使用工具 锹 斧头 锄头
    if (REGEX.TOOL.test(item.type)) return protect.assertPerm(player, block.pos, "use_tools");

    // 有权限再触发 warp 的
    if (REGEX.SIGN.test(block.type)) {
        if (protect.assertPerm(player, block.pos, "use_sign")) {
            return Event.check("onUseSignAfter", player, block);
        }
        return false;
    }

    if (REGEX.FURNACE.test(block.type)) return protect.assertPerm(player, block.pos, "use_furnace");
    if (REGEX.CONTAINER.test(block.type)) return protect.assertPerm(player, block.pos, "use_container");
    if (REGEX.ANVIL.test(block.type)) return protect.assertPerm(player, block.pos, "use_anvil");
    if (REGEX.DOOR.test(block.type)) return protect.assertPerm(player, block.pos, "use_door");

    const perm = ITEM_PERMS.get(item.type) ?? BLOCK_PERMS.get(block.type);
    if (perm) return protect.assertPerm(player, block.pos, perm);

    return true;
});

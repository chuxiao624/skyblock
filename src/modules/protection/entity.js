
import { Event } from "plugins/skyblock/src/core/EventBus.js";
import { protect } from "plugins/skyblock/src/api/protect.js";
import { FRIENDLY_MOBS } from "plugins/skyblock/src/modules/protection/rules.js";

// 攻击实体
mc.listen("onAttackEntity", (player, entity) => {
    if (entity.isPlayer()) {
        return protect.assertPerm(player, entity.pos, "atk_player");
    }
    if (FRIENDLY_MOBS.has(entity.type)) {
        return protect.assertPerm(player, entity.pos, "atk_friendly_mob");
    }
    return protect.assertPerm(player, entity.pos, "atk_hostile_mob");
});

// 骑乘
mc.listen("onRide", (entity1, entity2) => {
    if (!entity1.isPlayer()) return;
    return protect.assertPerm(entity1.toPlayer(), entity2.pos, "ride_entity");
});

// 与实体交互
mc.listen("onPlayerInteractEntity", (player, entity, pos) => protect.assertPerm(player, pos, "interact_entity"));

// 操作盔甲架
mc.listen("onChangeArmorStand", (as, pl, slot) => protect.assertPerm(pl, as.pos, "use_armor_stand"));

// 操作展示框
mc.listen("onUseFrameBlock", (player, block) => protect.assertPerm(player, block.pos, "use_item_frame"));

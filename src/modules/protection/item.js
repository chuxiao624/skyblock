
import { protect } from "plugins/skyblock/src/api/protect.js";

// 捡东西
mc.listen("onTakeItem", (player, entity, item) => protect.assertPerm(player, player.pos, "take_item"));

// 丢东西
mc.listen("onDropItem", (player, item) => protect.assertPerm(player, player.pos, "drop_item"));

// 弹射物
mc.listen("onSpawnProjectile", (shooter, type) => {
    if (!shooter.isPlayer()) return;
    const player = shooter.toPlayer();
    if (type === "minecraft:fishing_hook") {
        return protect.assertPerm(player, shooter.pos, "use_fishing");
    }
    return protect.assertPerm(player, shooter.pos, "use_throwable");
});

// 触发压力板
mc.listen("onStepOnPressurePlate", (entity, pressurePlate) => {
    if (!entity.isPlayer()) return;
    return protect.assertPerm(entity.toPlayer(), pressurePlate.pos, "use_pressure_plate");
});

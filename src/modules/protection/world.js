/**
 * 世界事件类保护
 */

import { protect } from "plugins/skyblock/src/api/protect.js";
// 实体爆炸
mc.listen("onEntityExplode", (source, pos) => protect.checkEventPerm(pos, "onEntityExplode"));

// 凋零破坏
mc.listen("onWitherBossDestroy", (witherBoss) => protect.checkEventPerm(witherBoss.pos, "onWitherBossDestroy"));

// 火焰蔓延
mc.listen("onFireSpread", (pos) => protect.checkEventPerm(pos, "onFireSpread"));

// 方块爆炸
mc.listen("onBlockExplode", (source, pos) => protect.checkEventPerm(pos, "onBlockExplode"));

// 重生锚爆炸
mc.listen("onRespawnAnchorExplode", (pos) => protect.checkEventPerm(pos, "onRespawnAnchorExplode"));

// 耕地退化
mc.listen("onFarmLandDecay", (pos) => protect.checkEventPerm(pos, "onFarmLandDecay"));

# 权限节点表

完整列出 SkyBlock 用到的所有权限节点。这些节点同时出现在:

- `runtime/permissions.json` 的每个岛屿 `defaults` / `events` 字段
- `runtime/config/permissions.json` 的每个维度 `defaults` / `events` 字段
- `/is perm` GUI 的开关项
- `skyblock.perms.addPermToPlayer(islandId, xuid, node)` 的 `node` 参数

## 判定流程

```
1. 玩家 OP 且 admin_bypass=true            → 放行
2. 末地                                    → 走全局 permissions.json[end]
3. 下界 且 nether_as_island=false          → 走全局 permissions.json[nether]
4. pos 落在某岛 (用 SpatialGrid 查询):
     a. 玩家是该岛 members[xuid]            → 放行
     b. 玩家在 allowlist[xuid] 且节点匹配   → 放行
     c. 否则用该岛 defaults[node]
5. pos 不在任何岛                           → 走全局 permissions.json[overworld]
```

events 类节点没有 `player` 上下文,只看坐标 → 岛屿 events → 全局 events。

## 节点表

| 权限 | 描述 |
| --- | --- |
| `destroy_block` | 允许破坏方块 |
| `place_block` | 允许放置方块 |
| `atk_player` | 攻击玩家(pvp) |
| `atk_friendly_mob` | 攻击友好生物 |
| `atk_hostile_mob` | 攻击敌对生物 |
| `take_item` | 玩家捡起物品 |
| `drop_item` | 玩家丢出物品 |
| `ride_entity` | 骑乘实体 |
| `interact_entity` | 与实体交互 |
| `use_armor_stand` | 使用盔甲架 |
| `use_item_frame` | 操作物品展示框 |
| `use_tools` | 使用工具(锹/锄/斧) |
| `use_bucket` | 使用桶(水/岩浆) |
| `use_bone_meal` | 使用骨粉 |
| `use_fishing` | 使用钓鱼竿 |
| `use_throwable` | 使用投掷物(弓/弩/雪球/...) |
| `place_boat` | 放置船 |
| `place_minecart` | 放置矿车 |
| `use_pressure_plate` | 触发压力板 |
| `use_button` | 使用按钮 |
| `use_lever` | 使用拉杆 |
| `use_door` | 使用门/栅栏门/活板门 |
| `use_sign` | 使用告示牌 |
| `use_container` | 使用箱子/潜影盒 |
| `use_barrel` | 使用木桶 |
| `use_hopper` | 使用漏斗 |
| `use_dispenser` | 使用发射器 |
| `use_dropper` | 使用投掷器 |
| `use_furnace` | 使用熔炉类(熔炉/高炉/烟熏炉) |
| `use_crafting_table` | 使用工作台 |
| `use_workbench` | 使用工作站(酿造台/锻造台/合成器/...) |
| `use_anvil` | 使用铁砧 |
| `use_enchanting_table` | 使用附魔台 |
| `use_bookshelf` | 使用书架 |
| `use_jukebox` | 使用唱片机 |
| `use_noteblock` | 使用音符盒 |
| `use_cake` | 吃蛋糕 |
| `use_comparator` | 使用红石比较器 |
| `use_repeater` | 使用红石中继器 |
| `use_lectern` | 使用讲台 |
| `use_respawn_anchor` | 使用重生锚 |
| `use_beacon` | 使用信标 |
| `use_bed` | 使用床 |
| `onEntityExplode` | 实体爆炸 |
| `onWitherBossDestroy` | 凋零破坏方块 |
| `onFireSpread` | 火焰蔓延 |
| `onBlockExplode` | 方块爆炸 |
| `onRespawnAnchorExplode` | 重生锚爆炸 |
| `onFarmLandDecay` | 耕地退化 |

## 在代码中怎么用

```js
// 检查权限
skyblock.protect.assertPerm(player, pos, "destroy_block");

// 改某岛默认权限
const cur = skyblock.perms.get(islandId, "defaults");
cur.atk_player = true;
skyblock.perms.setDefaults(islandId, cur);

// 给某玩家加白名单节点
skyblock.perms.addPermToPlayer(islandId, targetXuid, "use_container");
```

## 添加新的权限节点

如果你想增加一个全新节点:

1. 在 `repos/PermissionRepo.js` 的 `TEMPLATE.defaults` 加上新字段。
2. 在 `repos/PermsConfigRepo.js` 的 `TEMPLATE.defaults` 也加上。
3. 在 `modules/protection/*.js` 中 `mc.listen` 对应的 LSE 事件,调 `protect.assertPerm(..., "你的节点")`。
4. 在 `lang/zh_CN.json` 加 `"permission.你的节点": "描述"`。
5. 重启后 `_migrate` 会自动给所有现有岛屿补上这个字段(默认 false)。

如果你只想在扩展插件里加自定义保护规则,推荐用 `Event.guard` 直接拦截,不必引入新节点。详见 [自定义保护规则]。

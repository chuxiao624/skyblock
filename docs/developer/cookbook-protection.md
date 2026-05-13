# 自定义保护规则

如何在不修改内置代码的前提下,加一条自己的保护规则。

## 三种模式

| 模式 | 适合 | 示例 |
| --- | --- | --- |
| 模式 1:`Event.guard` 叠加规则 | 想"在标准检查的基础上再放行某些情况" | "VIP 玩家在任何地方都能放方块" |
| 模式 2:`mc.listen` 拦截 | 想"无视标准检查,强行拦截" | "博物馆区域任何人不能破坏" |
| 模式 3:`Event.on` 监听 | 想"在动作发生后追加效果",不拦截 | "记录每次破坏方块的日志" |

## 模式 1:放行(叠加规则)

`Event.guard` 是 **白名单语义**——只要任意一个 guard 返回 `true` 就放行。所以你的 guard 适合做"额外放行":

```js
// 例:VIP 玩家在任何地方都能放方块
skyblock.Event.guard("onPlaceBlock", (player, block) => {
    if (player.getTag?.("vip")) {
        return true;  // 放行,绕过标准 protect.assertPerm
    }
    return false;     // 让标准守卫继续判断
});
```

### 注意

```
内置保护已经注册了:
    Event.guard("onPlaceBlock", (player, block) => {
        return protect.assertPerm(player, block.pos, "place_block");
    });

你新加:
    Event.guard("onPlaceBlock", (player, block) => {
        return isVip(player);
    });

判定:
    任意一个 guard 返回 true → 放行
```

所以你的"VIP 放行"会**叠加在标准之上**。

### 不适合用 guard 做拦截

如果你想"在博物馆内禁止破坏",写:

```js
skyblock.Event.guard("onDestroyBlock", (player, block) => {
    if (inMuseum(block.pos)) return false;  // ← 没用!
    return false;
});
```

不会有效。因为内置保护对岛主返回 `true`,**任意一个 true 就放行**,你的 false 被覆盖了。

要拦截,用模式 2。

## 模式 2:拦截(直接 listen)

```js
const MUSEUM_ISLAND_ID = "abcd1234...";

mc.listen("onDestroyBlock", (player, block) => {
    if (player.isAdmin) return;  // 管理员豁免

    const id = skyblock.protect.findIslandId(block.pos);
    if (id === MUSEUM_ISLAND_ID) {
        player.tell("§c博物馆禁止破坏", 4);
        return false;  // ← 这个 false 会真的拦截事件
    }
});
```

`mc.listen` 的回调返回 `false` 会被 LSE 直接拦截动作,**优先级高于 EventBus**。

### 注意

- 你的 `mc.listen` 与内置 `mc.listen` 是 **独立两套监听**。LSE 只要任一个返回 false 就拦截。
- 所以这种写法不会绕过内置保护——内置保护拦截了的依然拦截,你只是**额外拦截**了更多情况。

## 模式 3:旁观(on 监听)

```js
skyblock.Event.on("island:created", (xuid, islandId, range, template) => {
    log.info(`新岛屿: ${islandId} owner=${xuid}`);
    // 这里只能"记录""通知""副作用",不能改变结果
});
```

适合:

- 日志 / 审计
- 数据库同步
- Webhook 通知
- 发奖励 / 加经验

## 实战场景

### 主城禁止任何玩家行为

```js
const SPAWN_ISLAND_ID = "your_spawn_island_id";

const eventsToProtect = [
    "onDestroyBlock",
    "onPlaceBlock",
    "onUseItemOn",
    "onAttackEntity",
    "onTakeItem",
    "onDropItem",
];

for (const evtName of eventsToProtect) {
    mc.listen(evtName, (player, ...args) => {
        // 第一个 args 通常是 block 或 entity,取它的 pos
        const obj = args[0];
        const pos = obj?.pos ?? player.pos;
        const id = skyblock.protect.findIslandId(pos);
        if (id === SPAWN_ISLAND_ID && !player.isAdmin) {
            player.tell("§c主城受保护", 4);
            return false;
        }
    });
}
```

### 给 VIP 加 PvP 放行权限

```js
skyblock.Event.guard("onAttackEntity", (player, entity) => {
    if (!entity.isPlayer()) return false;
    if (player.getTag?.("vip")) return true;  // VIP 总能 PVP
    return false;
});
```

### 给某个岛屿强制开启火焰蔓延

世界事件用 `checkEventPerm`,没有 player 上下文,不能用上面的策略。你需要直接改岛屿权限:

```js
const TARGET_ISLAND_ID = "...";
const events = skyblock.perms.get(TARGET_ISLAND_ID, "events");
events.onFireSpread = true;
skyblock.perms.setEvents(TARGET_ISLAND_ID, events);
```

(也可以让玩家自己在 `/is perm edit` 里勾选。)

## 优先级速记

```
mc.listen 返回 false                  ← 最强拦截,LSE 层
  └─ skyblock.Event.check 返回 false  ← 内部聚合判定
       └─ skyblock.Event.guard 注册的多个 fn,任一 true 即放行
```

所以:

- **想强行拦截某事**:用 `mc.listen` + 自己 return false
- **想给某事开后门**:用 `Event.guard` + return true
- **想只观察不干预**:用 `Event.on`

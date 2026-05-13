# 事件清单

按命名空间分组列出所有可订阅 / 守卫的事件。事件总线的语义见 [skyblock.Event](./api-event)。

## 命名约定

| 前缀 | 含义 |
| --- | --- |
| `island:*` | 岛屿数据变更(由 `services/IslandService` 触发) |
| `player:*` | 玩家位置变化(由 `services/TrackerService` 触发) |
| `admin:*` | 管理员代理状态变更 |
| `on*` | LSE 风格的事件(由 `modules/protection/*` 转发给 EventBus 用作 guard) |

## 岛屿事件 (island:*)

类型都是 **on** 广播(用 `Event.on(...)` 订阅)。

### `island:created`

新岛屿创建后。

```js
skyblock.Event.on("island:created", (xuid, islandId, range, template) => {
    // xuid: 岛主 xuid
    // islandId: 新岛 id
    // range: { center: {x,z}, min: [x,z], max: [x,z] }
    // template: 创建时选用的模板对象
});
```

### `island:removed`

岛屿被解散 / 强删后。

```js
skyblock.Event.on("island:removed", ({ islandId, owner, members }) => {
    // owner: 原岛主 xuid(自定义岛屿为 null)
    // members: 删除前所有成员 xuid 数组
});
```

### `island:memberJoined`

新成员加入(`addMember` 成功后)。

```js
skyblock.Event.on("island:memberJoined", ({ islandId, xuid }) => { ... });
```

### `island:memberLeft`

成员离开 / 被踢(`removeMember` 成功后)。

```js
skyblock.Event.on("island:memberLeft", ({ islandId, xuid }) => { ... });
```

### `island:transferred`

岛主转让后。

```js
skyblock.Event.on("island:transferred", ({ islandId, oldOwner, newOwner }) => { ... });
```

### `island:resized`

岛屿扩缩后。

```js
skyblock.Event.on("island:resized", ({ islandId, oldRange, newRange }) => { ... });
```

### `island:customCreated`

自定义岛屿创建后(由管理员触发)。

```js
skyblock.Event.on("island:customCreated", (adminXuid, islandId, range, template) => { ... });
```

### `island:proxyJoined`

管理员代理加入(`AdminProxySvc.enter` 时,先触发这个,再触发 `admin:proxyEntered`)。

```js
skyblock.Event.on("island:proxyJoined", ({ islandId, adminXuid }) => { ... });
```

### `island:proxyLeft`

管理员代理退出。

```js
skyblock.Event.on("island:proxyLeft", ({ islandId, adminXuid }) => { ... });
```

## 玩家位置事件 (player:*)

类型都是 **on** 广播,由 `TrackerService.tick()` 每 500ms 调度一次。

### `player:enterIsland`

玩家物理位置进入某个岛屿(从无岛 / 别的岛切换到这个岛)。

```js
skyblock.Event.on("player:enterIsland", (player, islandId) => {
    // 经典用法:发"欢迎来到 X 岛"标题
});
```

### `player:leaveIsland`

玩家物理位置离开某个岛屿。

```js
skyblock.Event.on("player:leaveIsland", (player, islandId) => { ... });
```

### `player:stayOnIsland`

玩家持续停留在同一个岛屿(每 500ms 触发一次,只要 tick 检测到他还在原岛)。

```js
skyblock.Event.on("player:stayOnIsland", (player, islandId) => {
    // 注意:这个会被频繁触发,内部需要自己做节流
});
```

::: warning stayOnIsland 触发频率
这是 500ms 一次的全员事件。如果你的回调要访问磁盘 / 做重计算,**自己加节流逻辑**。参考内置 `tips.js`:

```js
const STAY_MIN_INTERVAL = 1000;
const _lastStayTip = new Map();

skyblock.Event.on("player:stayOnIsland", (player, id) => {
    const now = Date.now();
    if (now - (_lastStayTip.get(player.xuid) ?? 0) < STAY_MIN_INTERVAL) return;
    _lastStayTip.set(player.xuid, now);
    // ...
});
```
:::

## 管理员事件 (admin:*)

### `admin:proxyEntered`

管理员通过 `/isa sudo` 进入代理(或启动期 restore 完成,**注意 restore 不触发 emit**)。

```js
skyblock.Event.on("admin:proxyEntered", ({ adminXuid, oldIsland, proxy }) => { ... });
```

### `admin:proxyExited`

管理员退出代理。

```js
skyblock.Event.on("admin:proxyExited", ({ adminXuid, oldIsland, proxy }) => { ... });
```

## 内部转发事件 (on*)

这些事件由 `modules/protection/*` 从 LSE 转发到内部总线,**用 `guard` / `check` 订阅**(白名单语义)。

```
LSE 事件                  内部 EventBus 名
─────────────────────  →  ──────────────────────
mc.listen onDestroyBlock → onDestroyBlock        (guard)
mc.listen onPlaceBlock   → onPlaceBlock          (guard)
mc.listen onUseItemOn    → onUseItemOn           (guard)
                       ↘
                          onUseSignAfter         (guard,木牌右键内部二级派发)

onDestroyBlock 通过后:
                          onDestroySignAfter     (on 广播,木牌破坏后清理传送点用)
```

### 怎么扩展保护规则

```js
// 例:管理员区域内,任何人(包括岛主)不能破坏
skyblock.Event.guard("onDestroyBlock", (player, block) => {
    const id = skyblock.protect.findIslandId(block.pos);
    if (id === MUSEUM_ISLAND_ID && !player.isAdmin) {
        player.sendMsg("博物馆禁止破坏");
        return false;  // 不放行
    }
    return true;       // 放行(交给后续守卫继续判断)
});
```

::: warning guard 是白名单语义
**任意一个 guard 返回 `true` 即放行**,所以你写的"禁止"规则不能简单返回 false——内置的标准保护守卫如果返回 true(玩家是成员),你的禁止规则就被覆盖了。

正确做法是在你的 guard 里 **直接做拦截后 return false**,然后让"标准守卫"也返回 false。这意味着:**你的规则只有在同一事件名 + 同一坐标 + 所有守卫都不放行时才生效**。

实际操作:不要走 guard,直接在 LSE `mc.listen` 里手写检查 + 返回 false,确保拦截不被覆盖:

```js
mc.listen("onDestroyBlock", (player, block) => {
    const id = skyblock.protect.findIslandId(block.pos);
    if (id === MUSEUM_ISLAND_ID && !player.isAdmin) {
        player.sendMsg("博物馆禁止破坏");
        return false;
    }
});
```

详见 [自定义保护规则](./cookbook-protection)。
:::

### `onUseSignAfter` / `onDestroySignAfter`

`modules/protection/block.js` 在标准 `use_sign` / `destroy_block` 检查通过后,会派发这两个事件。`warp/sign.js` 用它们实现传送点的激活 / 清理。

```js
skyblock.Event.guard("onUseSignAfter", (player, block) => {
    // 右键木牌后的逻辑(已经通过了 use_sign 权限)
});

skyblock.Event.on("onDestroySignAfter", (player, block) => {
    // 木牌被破坏后(已经通过了 destroy_block)
});
```

## 自定义事件

你的扩展可以定义自己的事件,推荐加 `<插件名>:` 前缀:

```js
// 触发
skyblock.Event.emit("myplugin:somethingHappened", { foo: "bar" });

// 订阅(其他扩展)
skyblock.Event.on("myplugin:somethingHappened", (data) => { ... });
```

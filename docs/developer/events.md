# 事件清单

本页列出所有 skyblock 提供的事件。

## 两种使用方式

事件有两类用法,**本质上都是事件**,只是订阅 / 触发的 API 不一样:

| 用法 | 订阅 | 触发 | 能干什么 |
| --- | --- | --- | --- |
| **通知** | `skyblock.Event.on(name, fn)` | `skyblock.Event.emit(name, ...args)` | 知道某件事发生了,可以执行副作用(发消息、记日志、给奖励...),但 **不能阻止它** |
| **可拦截** | `skyblock.Event.guard(name, fn)` | `skyblock.Event.check(name, ...args)` | 在事件真正执行前介入,**返回 `true`** 表示放行 |

两者的回调签名几乎一样,只是 `guard` 的回调需要返回 `true` / `false`。

::: tip 为什么分两套
"通知"是单向广播,所有订阅者都会被调用,谁也不能干扰别人。
"可拦截"是因为权限检查这种场景需要"任意一方说不就否决",所以用 **任意 fn 返回 `true` 即放行** 的语义("白名单"逻辑)。
:::

## 命名约定

| 前缀 | 含义 |
| --- | --- |
| `island:*` | 岛屿数据变更 |
| `player:*` | 玩家位置变化 |
| `admin:*` | 管理员代理状态变更 |
| `on*` | LSE 风格事件(由 skyblock 的保护层转发到内部总线) |
| `on*After` | LSE 事件通过权限检查 **之后** 触发的"后置事件" |

## 全部事件一览

| 事件名 | 类型 | 触发时机 |
| --- | --- | --- |
| [`island:created`](#island-created) | 通知 | 玩家创建新岛屿后 |
| [`island:removed`](#island-removed) | 通知 | 岛屿被解散 / 强删后 |
| [`island:memberJoined`](#island-memberjoined) | 通知 | 新成员加入岛屿 |
| [`island:memberLeft`](#island-memberleft) | 通知 | 成员离开 / 被踢出 |
| [`island:transferred`](#island-transferred) | 通知 | 岛主转让 |
| [`island:resized`](#island-resized) | 通知 | 岛屿扩缩 |
| [`island:customCreated`](#island-customcreated) | 通知 | 管理员创建自定义岛屿 |
| [`island:proxyJoined`](#island-proxyjoined) | 通知 | sudo 管理员加入(临时成员身份) |
| [`island:proxyLeft`](#island-proxyleft) | 通知 | sudo 管理员退出 |
| [`admin:proxyEntered`](#admin-proxyentered) | 通知 | sudo 流程完成进入代理 |
| [`admin:proxyExited`](#admin-proxyexited) | 通知 | sudo 退出 |
| [`player:enterIsland`](#player-enterisland) | 通知 | 玩家走进某个岛 |
| [`player:leaveIsland`](#player-leaveisland) | 通知 | 玩家走出某个岛 |
| [`player:stayOnIsland`](#player-stayonisland) | 通知 | 玩家持续在某岛(每 500ms) |
| [`onDestroyBlock`](#ondestroyblock) | 可拦截 | 玩家破坏方块 |
| [`onPlaceBlock`](#onplaceblock) | 可拦截 | 玩家放置方块 |
| [`onUseItemOn`](#onuseitemon) | 可拦截 | 玩家右键物品到方块 |
| [`onUseSignAfter`](#onusesignafter) | 可拦截 | 右键告示牌通过 `use_sign` 检查后 |
| [`onDestroySignAfter`](#ondestroysignafter) | 通知 | 玩家破坏告示牌通过 `destroy_block` 检查后 |

---

## 岛屿生命周期事件

### island:created

玩家创建新岛屿后触发。

```js
skyblock.Event.on("island:created", (xuid, islandId, range, template) => {
    const p = mc.getPlayer(xuid);
    p?.sendMsg(`欢迎来到 ${islandId}!`);
});
```

| 参数 | 说明 |
| --- | --- |
| `xuid` | 岛主 xuid |
| `islandId` | 新岛 id(16 字符) |
| `range` | `{ center: {x,z}, min: [x,z], max: [x,z] }` |
| `template` | 创建时选用的模板对象 |

### island:removed

岛屿被解散或被管理员强删后触发。

```js
skyblock.Event.on("island:removed", ({ islandId, owner, members }) => {
    log.info(`岛屿 ${islandId} 被解散`);
});
```

| 参数 | 说明 |
| --- | --- |
| `islandId` | 被删的岛屿 id |
| `owner` | 原岛主 xuid;**自定义岛屿为 `null`** |
| `members` | 删除前所有成员 xuid 数组(方便通知 / 传送回主城) |

### island:memberJoined

成员加入岛屿(`addMember` 成功后)。

```js
skyblock.Event.on("island:memberJoined", ({ islandId, xuid }) => { ... });
```

### island:memberLeft

成员离开 / 被踢出。

```js
skyblock.Event.on("island:memberLeft", ({ islandId, xuid }) => { ... });
```

### island:transferred

岛主转让后。

```js
skyblock.Event.on("island:transferred", ({ islandId, oldOwner, newOwner }) => { ... });
```

### island:resized

岛屿扩建 / 缩小后。

```js
skyblock.Event.on("island:resized", ({ islandId, oldRange, newRange }) => { ... });
```

### island:customCreated

管理员通过 `/isa create` 创建自定义岛屿后。注意这与 `island:created` **不同**:自定义岛屿没有 owner,不计入玩家解散次数。

```js
skyblock.Event.on("island:customCreated", (adminXuid, islandId, range, template) => { ... });
```

### island:proxyJoined

管理员通过 `/isa sudo` 加入某岛(临时成员身份)。**先于 `admin:proxyEntered` 触发**。

```js
skyblock.Event.on("island:proxyJoined", ({ islandId, adminXuid }) => { ... });
```

### island:proxyLeft

管理员退出 sudo,从岛屿 members 移除。

```js
skyblock.Event.on("island:proxyLeft", ({ islandId, adminXuid }) => { ... });
```

---

## 管理员代理事件

### admin:proxyEntered

`/isa sudo` 完整流程结束(添加成员 + 改 index + 写盘)。

```js
skyblock.Event.on("admin:proxyEntered", ({ adminXuid, oldIsland, proxy }) => {
    // oldIsland: 进入代理前该管理员 index 指向的岛(可能为 null)
    // proxy: 被代理的岛 id
});
```

::: warning 启动期 restore 不触发
服务器重启后 `AdminProxySvc.restore()` 会修复内存状态,但**不会再次 emit** 这个事件。要在启动期感知代理状态请直接读 `runtime/admin_proxy.json`。
:::

### admin:proxyExited

`/isa sudo exit` 完成。

```js
skyblock.Event.on("admin:proxyExited", ({ adminXuid, oldIsland, proxy }) => { ... });
```

---

## 玩家位置事件

来自 `TrackerService`,每 500ms 轮询一次所有在线玩家。

### player:enterIsland

玩家物理位置进入某岛(从无岛 / 别的岛切换过来)。

```js
skyblock.Event.on("player:enterIsland", (player, islandId) => {
    const name = skyblock.island.getIslandName(islandId);
    player.setTitle(`§a欢迎来到 §c${name}`);
});
```

### player:leaveIsland

玩家走出某岛。

```js
skyblock.Event.on("player:leaveIsland", (player, islandId) => { ... });
```

### player:stayOnIsland

玩家持续停留在同一岛屿。**每 500ms 触发一次**,只要 tick 检测到他还在原岛。

```js
skyblock.Event.on("player:stayOnIsland", (player, islandId) => { ... });
```

::: warning 频率高,自己节流
这是 500ms × 在线人数 的全员事件。回调里要读盘或重计算的话**自己加节流**:

```js
const STAY_MIN_INTERVAL = 1000;
const _last = new Map();

skyblock.Event.on("player:stayOnIsland", (player, id) => {
    const now = Date.now();
    if (now - (_last.get(player.xuid) ?? 0) < STAY_MIN_INTERVAL) return;
    _last.set(player.xuid, now);
    // ...
});
```
:::

---

## 玩家行为事件(可拦截)

这一组事件由 skyblock 的保护层从 LSE 转发到内部总线,**任意一个 guard 返回 `true` 即放行**,白名单语义。

内置保护规则已经注册了这些事件的标准 guard(检查权限节点)。你可以**叠加** 自己的 guard 做"额外放行":

```js
// 例:VIP 玩家可以在任何地方破坏方块
skyblock.Event.guard("onDestroyBlock", (player, block) => {
    if (player.getTag?.("vip")) return true;
    return false;  // 让标准 guard 接着判
});
```

如果想**额外拦截**(在内置规则放行的情况下也拒绝),用 `mc.listen` 而不是 `Event.guard`(因为白名单语义没法"否决"另一个 guard 的放行)。详见 [实战示例 · 自定义保护](./recipes#自定义保护规则)。

### onDestroyBlock

玩家破坏方块时。内置守卫会检查 `destroy_block` 权限节点。

```js
skyblock.Event.guard("onDestroyBlock", (player, block) => {
    // return true 放行
});
```

| 参数 | 说明 |
| --- | --- |
| `player` | 玩家对象 |
| `block` | 被破坏的方块,`block.pos` 取坐标 |

### onPlaceBlock

玩家放置方块时。内置守卫检查 `place_block`(放置桶时改检查 `use_bucket`)。

```js
skyblock.Event.guard("onPlaceBlock", (player, block) => { ... });
```

### onUseItemOn

玩家右键物品到方块时。内置守卫根据物品 / 方块类型,检查不同节点(`use_door` / `use_container` / `use_sign` / ...)。

```js
skyblock.Event.guard("onUseItemOn", (player, item, block, side, pos) => { ... });
```

| 参数 | 说明 |
| --- | --- |
| `player` | 玩家对象 |
| `item` | 手持物品 |
| `block` | 目标方块 |
| `side` | 点击的面 |
| `pos` | 精确点击位置 |

---

## 后置事件

LSE 事件通过权限检查 **之后** 才触发,内置传送点系统用它实现木牌激活 / 数据清理。

### onUseSignAfter

玩家右键告示牌、`use_sign` 权限通过后。**是"可拦截"事件**,但语义上通常用来"派发到具体功能"(如传送点激活),不是再做权限检查。

```js
skyblock.Event.guard("onUseSignAfter", (player, block) => {
    // 内置 warp 模块用这个事件实现木牌交互
    return true;
});
```

| 参数 | 说明 |
| --- | --- |
| `player` | 玩家对象 |
| `block` | 被右键的告示牌方块 |

### onDestroySignAfter

玩家破坏告示牌、`destroy_block` 权限通过后,**而且** 方块类型是告示牌。**是"通知"事件**,纯广播。

```js
skyblock.Event.on("onDestroySignAfter", (player, block) => {
    // 内置 warp 模块用这个清理被删传送点的数据
});
```

| 参数 | 说明 |
| --- | --- |
| `player` | 破坏者 |
| `block` | 被破坏的告示牌 |

---

## 自定义事件

扩展可以发布自己的事件,让其他扩展订阅。**事件名加 `<插件名>:` 前缀**:

```js
// economy.js
skyblock.Event.emit("economy:transferred", {
    from: alice.xuid,
    to:   bob.xuid,
    amount: 100,
});

// achievements.js
skyblock.Event.on("economy:transferred", ({ from, to, amount }) => {
    addAchievement(from, "first_transfer");
});
```

也可以发布"可拦截"事件,让其他扩展投票:

```js
// shop.js
const canBuy = skyblock.Event.check("shop:beforeBuy", player, item);
if (!canBuy) return;
```

```js
// quest.js(只允许完成新手任务的玩家买东西)
skyblock.Event.guard("shop:beforeBuy", (player, item) => {
    return player.getTag?.("tutorial_done") === true;
});
```

---

## 异常处理

| 容器 | 行为 |
| --- | --- |
| `guard` 回调抛异常 | 视为返回 `false`(不通过),记 error 日志 |
| `on` 回调抛异常 | 静默吞掉,记 error 日志,**继续调用后续 hooks** |

一个有 bug 的扩展不会阻塞总线,但你需要看控制台才能发现问题。日志 tag 是 `EventBus`。

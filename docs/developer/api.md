# API 速查

所有功能挂在 `globalThis.skyblock` 下。本页按命名空间分章节,每个方法 **一句话 + 最小示例**,深入用法去看 [事件清单](./events) 和 [实战示例](./recipes)。

## 命名空间一览

| 入口 | 类型 | 用途 |
| --- | --- | --- |
| [`skyblock.island`](#skyblock-island) | 业务 | 岛屿创建 / 查询 / 修改 |
| [`skyblock.perms`](#skyblock-perms) | 业务 | 改岛屿权限 |
| [`skyblock.protect`](#skyblock-protect) | 业务 | 权限检查 + 坐标查岛 |
| [`skyblock.Event`](#skyblock-event) | 基础设施 | 事件订阅 / 触发 |
| [`skyblock.Command`](#skyblock-command) | 基础设施 | 注册 `/is` 子命令 |
| [`skyblock.Store`](#skyblock-store) | 基础设施 | 跨插件 KV / 函数 |
| [`skyblock.Session`](#skyblock-session) | 基础设施 | TTL 临时键值 |
| [`skyblock.Timer`](#skyblock-timer) | 基础设施 | 命名定时器 |
| [`skyblock.config`](#skyblock-config) | 基础设施 | 读全局配置 |
| [`skyblock.i18n`](#skyblock-i18n) | 基础设施 | 多语言 |
| [`skyblock.Tracker`](#skyblock-tracker) | 工具 | 玩家当前所在岛 |
| [LLSE_Player 扩展](#llse-player-扩展) | 原型扩展 | `player.islandId` 等 |

## 返回值约定

所有"写操作"都返回:

```ts
{ ok: boolean, code: string, ...payload? }
```

成功时 `ok: true, code: "ok"`,失败时 `ok: false, code: "<原因>"`(机读字符串,如 `"no_island"`、`"already_member"`)。常用 pattern:

```js
const r = skyblock.island.createIsland(xuid, name, template);
if (!r.ok) {
    player.sendMsg(skyblock.i18n.tr(`cmd.create.fail.${r.code}`));
    return;
}
// 用 r.islandId / r.spawn / ...
```

---

## skyblock.island {#skyblock-island}

岛屿的全套操作。

### 查询

```js
skyblock.island.getIslandData(islandId, key?)   // 整个数据 或 某个字段
skyblock.island.getIslandName(islandId)         // 带缓存的取名
skyblock.island.xuid2islandId(xuid)             // xuid 反查 islandId
skyblock.island.findByPos(pos)                  // 坐标 → islandId(O(1))
skyblock.island.listAll()                       // { islandId: data, ... }
skyblock.island.listByKind(kind)                // kind: "normal" 或 "custom"
skyblock.island.getDelCount(xuid)               // 玩家解散过的次数
```

::: warning findByPos 在静态导入期返回 null
SpatialGrid 在 `loadPlugins()` **之后** 才重建。在 `mc.listen` / `Event.on` 等回调里调用是安全的。
:::

### 写操作

```js
// 创建普通岛屿(玩家自己创),返回 { ok, code, islandId?, spawn?, loadInfo?, range? }
skyblock.island.createIsland(xuid, ownerName, template)

// 创建自定义岛屿(管理员创,无 owner),用法同上
skyblock.island.createCustom(adminXuid, name, template)

// 解散
skyblock.island.removeIsland(islandId, { countReset: true })

// 成员
skyblock.island.addMember(islandId, xuid, trustLevel?)
skyblock.island.removeMember(islandId, xuid)
skyblock.island.setSpawn(islandId, xuid, [x, y, z, dimid])
skyblock.island.transfer(islandId, newOwnerXuid, newOwnerName?)

// 岛屿属性
skyblock.island.rename(islandId, newName)
skyblock.island.setIslandSpawn(islandId, spawn)    // 自定义岛屿专用
skyblock.island.resize(islandId, newSize)          // 新边长(>=16)
skyblock.island.expand(islandId, delta)            // 四向各 +delta
skyblock.island.shrink(islandId, delta)            // 四向各 -delta

// 解散次数
skyblock.island.resetDelCount(xuid)
```

常见 `code`:`no_island` / `already_have` / `already_member` / `in_other_island` / `is_owner` / `not_member` / `same_owner` / `too_small` / `conflict`(扩缩时与邻居重叠,带 `conflictId`)。

---

## skyblock.perms {#skyblock-perms}

岛屿权限编辑。权限节点名见 [权限节点表](./permission-nodes)。

```js
// 读取
skyblock.perms.get(islandId, key?)
// 不传 key 返回完整对象: { defaults, events, allowlist, roles }
// 传 key 返回单个字段

// 写默认权限(整体覆盖,不合并)
skyblock.perms.setDefaults(islandId, defaultsObj)
skyblock.perms.setEvents(islandId, eventsObj)

// 白名单(给个别玩家放权)
skyblock.perms.addPermToPlayer(islandId, xuid, node)
skyblock.perms.removePermFromPlayer(islandId, xuid, node)
skyblock.perms.setPlayerPerms(islandId, xuid, nodeArray)
```

`setDefaults` 是 **整体替换**,不是合并。安全 pattern:

```js
const cur = skyblock.perms.get(islandId, "defaults");
cur.atk_player = true;
skyblock.perms.setDefaults(islandId, cur);
```

---

## skyblock.protect {#skyblock-protect}

权限检查 + 坐标查岛。

```js
// 玩家在某点是否有权限(返回 boolean)
skyblock.protect.checkPerm(player, pos, node)

// 同上,但失败时给玩家发 actionbar 提示(直接 return 即可)
skyblock.protect.assertPerm(player, pos, node)

// 世界事件检查(没有 player 上下文,只看坐标)
skyblock.protect.checkEventPerm(pos, node)

// 坐标 → islandId
skyblock.protect.findIslandId(pos)
```

`mc.listen` 里加自定义保护的标准写法:

```js
mc.listen("onMyCustomEvent", (player, pos) => {
    return skyblock.protect.assertPerm(player, pos, "my_node");
});
```

判定流程见 [权限节点表](./permission-nodes#判定流程)。

---

## skyblock.Event {#skyblock-event}

事件订阅 / 触发。**两套用法**:

```js
// 用法 A:on / emit —— 广播,所有订阅者都被调用,不收集返回值
skyblock.Event.on(name, fn)
skyblock.Event.emit(name, ...args)

// 用法 B:guard / check —— 可拦截,任意一个 fn 返回 true 即"放行"
skyblock.Event.guard(name, fn)
skyblock.Event.check(name, ...args)    // 返回 boolean
```

什么时候用 A 还是 B,以及完整事件清单,见 [事件清单](./events)。

---

## skyblock.Command {#skyblock-command}

注册 `/is` 子命令。

### 简写(无参数)

```js
skyblock.Command.registerAll({
    "hello": (origin) => {
        const player = origin.player;
        if (!player) return;
        player.sendMsg("hi");
    },
});
```

使用 `/is hello`。

### 带参数 / 枚举 / 重载

```js
skyblock.Command.registerAll({
    "shop": {
        enums:    { shop_action: ["open", "close", "reload"] },
        params:   { shop_target: { type: ParamType.String, optional: true } },
        overloads: [
            ["shop_action"],
            ["shop_action", "shop_target"],
        ],
        callback: (origin, output, results) => {
            const player = origin.player;
            switch (results.shop_action) {
                case "open":   return openShop(player, results.shop_target);
                case "close":  return closeShop(player);
                case "reload": return reloadShop(player);
            }
        },
    },
});
```

| 字段 | 说明 |
| --- | --- |
| `enums` | 枚举参数,key 是参数名,value 是候选数组 |
| `params` | 普通参数,`{ type, optional }` 或直接传 `ParamType.X` |
| `overloads` | 重载数组,每条列出该重载用到的参数名(子命令名自动加在最前) |
| `callback` | `(origin, output, results) => void` |

### runIs(覆盖 `/is` 默认行为)

```js
skyblock.Command.runIs = (origin) => {
    if (origin.player) openMainGui(origin.player);
};
```

默认 `/is` 不带子命令时显示 help,这里可以改成弹 GUI。

### 注意

- **必须在文件顶层注册**。`Command.setup()` 在 loadPlugins 后立即执行,延迟到回调里注册会失败。
- 同名子命令重复注册会被忽略并打 warn。
- 帮助文本走 `Store`,见下文。

---

## skyblock.Store {#skyblock-store}

跨插件共享 KV + 函数注册。

```js
// KV
skyblock.Store.set(key, value, force?)   // force 默认 false,key 已存在时拒绝写
skyblock.Store.get(key)
skyblock.Store.has(key)                  // KV 和函数都算

// 函数注册(类似 RPC)
skyblock.Store.register(name, fn, force?)
skyblock.Store.call(name, ...args)       // 未注册返回 undefined,不抛错
```

最常见用法:

```js
// 暴露查询接口给别的插件
skyblock.Store.register("myplugin:getX", (id) => myData[id], true);

// 别的插件调用
const x = skyblock.Store.call("myplugin:getX", "abc");
```

**`Store` 是内存的,重启就没了**。要持久化用 `JsonConfigFile`。

帮助文本约定 key 是 `"help"`,追加自己的命令描述:

```js
skyblock.Store.set("help", skyblock.Store.get("help") + "\n§e/is xxx §7- ...", true);
```

---

## skyblock.Session {#skyblock-session}

TTL 自动过期的命名空间键值。用于邀请确认、解散二次确认这类"短期有效"的状态。

```js
skyblock.Session.set(namespace, key, value, ttlSec)
skyblock.Session.get(namespace, key)         // undefined if 不存在 / 已过期
skyblock.Session.has(namespace, key)
skyblock.Session.del(namespace, key)
skyblock.Session.clearNamespace(namespace)
```

例子:

```js
// 设邀请,30 秒后自动消失
skyblock.Session.set("invite", target.xuid, player.xuid, 30);

// 检查 + 取出
if (skyblock.Session.has("invite", player.xuid)) {
    const inviter = skyblock.Session.get("invite", player.xuid);
    skyblock.Session.del("invite", player.xuid);
}
```

---

## skyblock.Timer {#skyblock-timer}

命名定时器,同名自动取消旧的。

```js
skyblock.Timer.start(key, fn, intervalMs)    // setInterval 版,start 自动覆盖
skyblock.Timer.stop(key)
skyblock.Timer.delay(key, fn, ms)            // setTimeout 版,delay 自动覆盖
skyblock.Timer.cancel(key)
```

例子(等区块加载完成):

```js
skyblock.Timer.start(`load:${player.xuid}`, () => {
    if (mc.getBlock(spawnPos) == null) return;       // 还没加载
    mc.runcmdEx(`structure load xxx ...`);
    skyblock.Timer.stop(`load:${player.xuid}`);
}, 100);
```

---

## skyblock.config {#skyblock-config}

读全局配置(`runtime/config/config.json`)。

```js
skyblock.config.get("admins")            // string[]
skyblock.config.get("lang")              // "zh_CN" 等
skyblock.config.get("respawn")           // [x, y, z, dimid]
skyblock.config.get("templates")         // 岛屿模板数组
skyblock.config.get("member_limit")      // 成员上限
skyblock.config.get("reset_limit")       // 解散次数上限
skyblock.config.get("nether_as_island")  // 下界是否作为岛屿
skyblock.config.get("admin_bypass")      // OP 是否绕过保护
skyblock.config.get("island")            // { startX, startZ, range, gap }

skyblock.config.set(key, value)          // 立即写盘
```

完整字段见 [全局配置](/server/configuration)。

---

## skyblock.i18n {#skyblock-i18n}

多语言。文案找不到时返回 key 本身,不抛错。

```js
skyblock.i18n.tr(key, vars?)             // 翻译,{name} 这种占位符走 vars
skyblock.i18n.register(lang, messages)   // 注册一组文案到指定语言
skyblock.i18n.setLang(lang)              // 切语言(写入 config.json)
skyblock.i18n.getLang()
```

扩展国际化典型写法:

```js
skyblock.i18n.register("zh_CN", {
    "myplugin.hello": "你好,{name}!",
});
skyblock.i18n.register("en_US", {
    "myplugin.hello": "Hello, {name}!",
});

const msg = skyblock.i18n.tr("myplugin.hello", { name: "chuxiao" });
```

key 命名建议加 `<插件名>.` 前缀,避免与内置文案冲突。

---

## skyblock.Tracker {#skyblock-tracker}

玩家位置追踪。每 500ms 全员轮询一次,内存 Map 维护"xuid → 当前所在 islandId"。

```js
skyblock.Tracker.playerIslandMap            // Map<xuid, islandId>

// 单个查询(快捷方式)
const id = skyblock.Tracker.playerIslandMap.get(player.xuid);
```

需要**立刻**判断玩家在哪个岛(不等下一次 tick),直接用 `skyblock.protect.findIslandId(player.pos)`。

---

## LLSE_Player 扩展 {#llse-player-扩展}

skyblock 在 `LLSE_Player.prototype` 上挂了便捷属性 / 方法。任何 `player` 对象上直接可用。

### 数据属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `player.islandId` | `string \| null` | 所属岛 id(不是当前所在岛) |
| `player.island` | `Object \| null` | 完整岛屿数据 |
| `player.isAdmin` | `boolean` | 是否在 `config.admins` 中 |
| `player.islandSpawn` | `[x,y,z,dimid] \| null` | 在自己岛的出生点 |
| `player.islandMembers` | `Object \| null` | 岛 members 字典 |
| `player.isIslandOwner` | `boolean` | 是否岛主(管理员也算 true) |
| `player.currentIslandId` | `string \| null` | 物理位置所在岛 id |
| `player.isOnOwnIsland` | `boolean` | 物理位置是否在自己岛上 |

### 方法

```js
// 带 [空岛] 前缀发消息
player.sendMsg(msg, mode?)
// mode: 0 = 聊天框(默认), 4 = ActionBar

// 守卫(前置检查 + 自动发提示 + 返回 boolean)
player.guardIsland()       // "没岛就提示并返回 false"
player.guardOwner()        // "不是岛主就提示并返回 false"
player.guardInIsland()     // "不在自己岛上就提示并返回 false"
```

命令处理的标准模式:

```js
function someAction(player) {
    if (!player.guardOwner() || !player.guardInIsland()) return;
    // 后续逻辑放心用 player.island / player.islandSpawn / ...
}
```

`OP 与 SkyBlock 管理员是两套体系`:
- `player.isOP()` 决定能不能绕过岛屿保护(配合 `admin_bypass`)
- `player.isAdmin` 决定能不能用 `/isa` 命令

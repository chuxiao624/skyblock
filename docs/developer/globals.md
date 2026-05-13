# globalThis.skyblock

所有对外接口挂在 `globalThis.skyblock` 命名空间下。第三方扩展只通过这个对象访问内置能力。

## 总览

```js
skyblock = {
    // ─── 基础设施 ───
    Event,        // 事件总线(guard / check / on / emit)
    Store,        // 跨插件 KV + 函数注册
    Session,      // TTL 自动过期键值
    Timer,        // 命名定时器
    Command,      // /is 子命令注册器

    // ─── 全局对象 ───
    config,       // 配置管理(读 / 写 runtime/config/config.json)
    i18n,         // 多语言

    // ─── 业务 API ───
    island,       // 岛屿生命周期 + 查询
    perms,        // 权限编辑
    protect,      // 保护检查

    // ─── 工具 ───
    Tracker,      // 玩家当前位置 → 岛屿
}
```

## 速查表

| 入口 | 简介 | 详细 |
| --- | --- | --- |
| `skyblock.island.*` | 创建 / 删除 / 转让 / 查询 / 扩缩岛屿 | [api-island](./api-island) |
| `skyblock.perms.*` | 改岛屿权限(defaults / events / allowlist) | [api-perms](./api-perms) |
| `skyblock.protect.checkPerm(p, pos, key)` | 检查玩家在某点是否有权限 | [api-protect](./api-protect) |
| `skyblock.protect.assertPerm(p, pos, key)` | 同上,失败时给玩家发提示 | [api-protect](./api-protect) |
| `skyblock.protect.checkEventPerm(pos, key)` | 检查世界事件(无玩家上下文) | [api-protect](./api-protect) |
| `skyblock.protect.findIslandId(pos)` | 坐标 → 岛屿 id | [api-protect](./api-protect) |
| `skyblock.Command.registerAll({...})` | 给 `/is` 注册子命令 | [api-command](./api-command) |
| `skyblock.Event.on(name, fn)` | 订阅广播事件 | [api-event](./api-event) |
| `skyblock.Event.guard(name, fn)` | 注册权限守卫 | [api-event](./api-event) |
| `skyblock.Event.emit(name, ...args)` | 触发广播 | [api-event](./api-event) |
| `skyblock.Event.check(name, ...args)` | 触发守卫,得到 boolean | [api-event](./api-event) |
| `skyblock.Store.set / get(key, value)` | 跨插件 KV | [api-store](./api-store) |
| `skyblock.Store.register / call(name, fn)` | 暴露 / 调用函数 | [api-store](./api-store) |
| `skyblock.Session.set / get / has / del` | TTL 临时键值 | [api-session](./api-session) |
| `skyblock.Timer.start / stop / delay / cancel` | 命名定时器 | [api-timer](./api-timer) |
| `skyblock.i18n.tr / register / setLang` | 多语言 | [api-i18n](./api-i18n) |
| `skyblock.config.get(key)` | 读配置(如 `member_limit`、`templates`) | - |
| `skyblock.Tracker.playerIslandMap` | `Map<xuid, islandId>` 当前位置 | - |

## LLSE_Player 扩展

除了 `skyblock.*` 命名空间,SkyBlock 还在 `LLSE_Player.prototype` 上挂了一些便捷属性 / 方法,在任何 `player` 对象上直接可用:

| 属性 / 方法 | 类型 | 说明 |
| --- | --- | --- |
| `player.islandId` | `string \| null` | 该玩家所属岛 id(成员身份) |
| `player.island` | `Island \| null` | 该玩家所属岛的完整数据 |
| `player.isAdmin` | `boolean` | 是否是 SkyBlock 管理员 |
| `player.islandSpawn` | `[x,y,z,dimid] \| null` | 该玩家在自己岛上的出生点 |
| `player.islandMembers` | `Object \| null` | 该岛 members 字典 |
| `player.isIslandOwner` | `boolean` | 是否是岛主(管理员也算 true) |
| `player.currentIslandId` | `string \| null` | 物理位置当前所在的岛 id |
| `player.isOnOwnIsland` | `boolean` | 物理位置是否在自己的岛上 |
| `player.sendMsg(msg, mode?)` | - | 带 `[空岛]` 前缀的发消息 |
| `player.guardIsland()` | `boolean` | "没岛就提示并返回 false" |
| `player.guardOwner()` | `boolean` | "不是岛主就提示并返回 false" |
| `player.guardInIsland()` | `boolean` | "不在自己岛上就提示并返回 false" |

详见 [LLSE_Player 扩展](./api-player)。

## 返回值约定

所有 `services/*` 的写操作返回:

```ts
{
    ok: boolean,
    code: string,
    ...payload
}
```

- `ok` 是布尔结果。
- `code` 是机读的状态串:
  - 成功:`"ok"`
  - 失败:具体原因,如 `"no_island"` / `"already_member"` / `"in_other_island"`...
- 失败时通常不带 payload。成功时可能带 `islandId / spawn / members / newRange` 等。

业务代码常见模式:

```js
const r = skyblock.island.createIsland(xuid, name, template);
if (!r.ok) {
    player.sendMsg(skyblock.i18n.tr(`cmd.create.fail.${r.code}`));
    return;
}
// 使用 r.islandId / r.spawn / r.loadInfo
```

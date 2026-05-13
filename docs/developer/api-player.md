# LLSE_Player 扩展

SkyBlock 在 `LLSE_Player.prototype` 上挂了一些便捷属性 / 方法。在任何 `player` 对象(`mc.getPlayer`、事件回调里的 player、`origin.player`)上都能直接用。

## 数据属性

### `player.islandId`

`string | null`,玩家所属的岛屿 id(基于 `IslandRepo` 的 index)。

```js
if (!player.islandId) {
    player.sendMsg("你还没有岛屿");
}
```

注意:

- 这是 **所属** 岛(成员身份),不是 **当前所在** 岛。
- 管理员 sudo 期间,index 指向被代理的岛,所以 `islandId` 会临时变成被代理的岛 id。

### `player.island`

`Island | null`,等价于 `IslandSvc.getById(player.islandId)`。

```js
const owner = player.island?.owner;
const members = player.island?.members;
```

### `player.islandSpawn`

`[x, y, z, dimid] | null`,玩家自己在所属岛屿的出生点。

```js
if (player.islandSpawn) {
    player.teleport(...player.islandSpawn);
}
```

### `player.islandMembers`

岛屿的 members 字典:`{ xuid: { trustLevel, spawn }, ... }`。

```js
const cnt = Object.keys(player.islandMembers || {}).length;
```

### `player.currentIslandId`

`string | null`,玩家 **物理位置** 当前所在的岛屿(从 Tracker 取)。

可能与 `islandId` 不同:玩家在别人岛上访问时,`currentIslandId` 是别人的岛,`islandId` 是自己的岛。

```js
if (player.currentIslandId !== player.islandId) {
    player.sendMsg("你在别人的岛上");
}
```

### `player.isAdmin`

`boolean`,是否在 `config.admins` 列表中。

```js
if (!player.isAdmin) {
    return player.sendMsg("仅管理员可用");
}
```

注意 `admin_bypass` 走的是 LSE 的 `player.isOP()`,不是这个字段。**OP 与 SkyBlock 管理员是两套体系。**

### `player.isIslandOwner`

`boolean`,是否是自己所属岛的岛主。**管理员也算 true**(为了简化检查)。

```js
if (!player.isIslandOwner) {
    return player.sendMsg("只有岛主能这么做");
}
```

### `player.isOnOwnIsland`

`boolean`,当前物理位置是否在自己所属的岛上。

```js
if (!player.isOnOwnIsland) {
    return player.sendMsg("你必须在自己的岛屿上");
}
```

## 工具方法

### `player.sendMsg(msg, mode?)`

带 `[空岛]` 前缀的发消息。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `msg` | `string` | 消息内容 |
| `mode` | `int` | `tell` 模式,默认 `CONST.TELL_CHAT (0)`,改 `4` 发 actionbar |

```js
player.sendMsg("§a操作成功");
player.sendMsg("§c不能这么做", 4);  // actionbar
```

前缀来自 `i18n.tr("skyblock.prefix")`,默认 `§a[空岛]§r`。可以在 `lang/zh_CN.json` 中改。

## 守卫方法

三个 `guard*` 方法做"前置检查 + 自动发提示 + 返回 boolean"的组合,在命令处理函数最前面用。

### `player.guardIsland()`

确保玩家有岛屿。无岛会自动 `sendMsg("§c你还没有岛屿")` 并返回 `false`。

```js
function disbandIsland(player) {
    if (!player.guardIsland()) return;
    // 此后保证 player.islandId 存在
}
```

### `player.guardOwner()`

`guardIsland` + "必须是岛主"。

```js
function transferIsland(player) {
    if (!player.guardOwner()) return;
    // 此后保证是岛主
}
```

### `player.guardInIsland()`

"必须在自己岛上"。**不检查是否有岛**——通常需要先调 `guardIsland()` 或 `guardOwner()`。

```js
function setSpawnIsland(player) {
    if (!player.guardIsland() || !player.guardInIsland()) return;
    // 此后保证站在自己岛上
}
```

## 实战 pattern

完整的命令处理:

```js
function someAction(player) {
    if (!player.guardOwner() || !player.guardInIsland()) return;

    // 这里可以放心用 player.island / player.islandId / player.islandSpawn
    const isl = player.island;
    // ...

    player.sendMsg("§a完成");
}
```

## 注意事项

- 这些 getter 每次访问都会查 Map / Repo,不是缓存。对于高频访问可以先存到本地变量:

```js
const islandId = player.islandId;
const island   = player.island;
// 用 islandId / island
```

- getter 在 `mc.getPlayer(xuid)` 返回 null 时不会被调用——所以上层先做 null 检查。

- `currentIslandId` 依赖 `Tracker.tick`(500ms 间隔)。玩家刚刚位移完后,可能要等下次 tick 才更新。需要立刻判断时用 `skyblock.protect.findIslandId(player.pos)`。

# skyblock.island

岛屿生命周期与查询接口。底层转发到 `services/IslandService.js`。

所有写操作返回 `{ ok: boolean, code: string, ...payload? }`。

## 查询

### `getIslandData(islandId, key?)`

读取岛屿数据。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `islandId` | `string` | 岛屿 id |
| `key` | `string?` | 可选,只取某个字段 |

```js
const data = skyblock.island.getIslandData("abc123");
// { name, owner, range, members, ... }

const owner = skyblock.island.getIslandData("abc123", "owner");
// "<ownerXuid>"
```

不存在的 islandId 返回 `null`。

### `getIslandName(islandId)`

`getIslandData(id, "name")` 的带缓存版,频繁查询用这个。

```js
const name = skyblock.island.getIslandName("abc123");
// "chuxiao"
```

### `xuid2islandId(xuid)`

xuid 反查 islandId,基于 `IslandRepo` 的 `index`。

```js
const id = skyblock.island.xuid2islandId(player.xuid);
// 等价于 player.islandId
```

### `getDelCount(xuid)`

玩家累计解散过的岛屿次数。

```js
const n = skyblock.island.getDelCount(player.xuid);
if (n >= skyblock.config.get("reset_limit")) {
    // 不能再解散了
}
```

### `findByPos(pos)`

坐标 → 岛屿 id。基于 `SpatialGrid`,O(1) 复杂度。

```js
const id = skyblock.island.findByPos({ x: 100, y: 64, z: 200, dimid: 0 });
// "abc123" 或 null
```

::: warning 启动期不可用
`findByPos` 依赖 `SpatialGrid`,**`rebuildGrid()` 在 `onServerStarted` 之后才执行**。静态导入期调用会返回 null。

`loadPlugins()` 期间已经可用了,所以扩展插件在加载时调用是安全的。
:::

### `listAll()`

返回所有岛屿:`{ islandId: islandData, ... }`。

```js
const all = skyblock.island.listAll();
for (const id in all) {
    console.log(id, all[id].name);
}
```

### `listByKind(kind)`

按 `kind` 字段过滤。

| 值 | 含义 |
| --- | --- |
| `"normal"` | 普通玩家岛屿(默认) |
| `"custom"` | 管理员创建的自定义岛屿 |

```js
const customs = skyblock.island.listByKind("custom");
```

## 写操作

### `createIsland(xuid, ownerName, template)`

创建一个普通岛屿。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `xuid` | `string` | 玩家 xuid |
| `ownerName` | `string` | 显示名(成为 island.name 的初值) |
| `template` | `Object` | 模板对象,来自 `config.get("templates")` |

返回:

```ts
{
    ok: true,
    code: "ok",
    islandId: string,
    spawn: [x, y, z, dimid],      // 出生点
    loadInfo: { file, loadPosX, loadPosY, loadPosZ },  // structure load 参数
    range: { center, min, max }
}
```

失败 `code`:`already_have`(玩家已有岛)。

::: tip 结构粘贴需自己做
本方法只分配坐标和写数据。`structure load` 需要调用方自行执行(参考 `modules/commands/island.js` 中 `createIsland` 的实现)。
:::

### `removeIsland(islandId, opts?)`

解散一个岛屿。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `islandId` | `string` | 岛屿 id |
| `opts.countReset` | `boolean` | 是否计入岛主解散次数,默认 `true` |

返回 `{ ok, code, members? }`,`members` 是删除前的成员 xuid 数组(便于通知 / 传送)。

失败 `code`:`no_island`。

### `addMember(islandId, xuid, trustLevel?)`

添加成员。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `trustLevel` | `int` | 信任等级,默认 `CONST.TRUST_MEMBER` (2) |

失败 `code`:`no_island` / `already_member` / `in_other_island`。

新成员的 spawn 默认复制岛主的当前 spawn。

### `removeMember(islandId, xuid)`

移除成员。

失败 `code`:`no_island` / `is_owner`(目标是岛主) / `not_member`。

### `setSpawn(islandId, xuid, spawn)`

设置某个成员的出生点。

```js
skyblock.island.setSpawn(player.islandId, player.xuid, [x, y, z, dimid]);
```

失败 `code`:`not_member`。

### `rename(islandId, name)`

修改岛屿名。

```js
skyblock.island.rename(islandId, "新岛名");
```

失败 `code`:`no_island`。

### `transfer(islandId, newOwnerXuid, newOwnerName?)`

转让岛主。

- 旧岛主降为 MEMBER。
- 新岛主升为 OWNER。
- 如果提供了 `newOwnerName`,island.name 也会改为这个值。

失败 `code`:`no_island` / `same_owner` / `not_member`。

### `resetDelCount(xuid)`

重置玩家的解散次数。

失败 `code`:`no_record`。

## 扩缩

### `resize(islandId, newSize)`

调整岛屿大小(以中心点为基准等比伸缩)。`newSize` 是新边长。

返回 `{ ok, code, newRange?, conflictId? }`。

失败 `code`:
- `no_island`
- `too_small`(newSize < 16)
- `conflict`(与其他岛屿重叠,`conflictId` 指明冲突的岛)

### `expand(islandId, delta)`

四个方向各 +delta 格,新边长 = 当前 + delta*2。

### `shrink(islandId, delta)`

四个方向各 -delta 格,新边长 = 当前 - delta*2。

## 自定义岛屿(管理员用)

### `createCustom(adminXuid, name, template)`

创建一个无 owner 的自定义岛屿。

- `owner = null`
- `kind = "custom"`
- `members = {}`(空)
- 顶层 `spawn` 字段记录出生点(替代 `members[owner].spawn`)

返回结构同 `createIsland`。

### `setIslandSpawn(islandId, spawn)`

设置自定义岛屿顶层 `spawn`(不针对成员)。

失败 `code`:`no_island`。

# skyblock.perms

岛屿权限编辑。底层转发到 `services/PermissionService.js`。

权限节点的完整清单见 [权限节点表](./permission-nodes)。

## 读取

### `get(islandId, key?)`

读取整个权限对象或某个字段。

```js
// 整个对象
const p = skyblock.perms.get(islandId);
// { defaults: {...}, events: {...}, allowlist: {...}, roles: {...} }

// 只读 defaults
const def = skyblock.perms.get(islandId, "defaults");

// 只读 allowlist
const allow = skyblock.perms.get(islandId, "allowlist");
// { "<xuid>": ["use_container", "use_door"], ... }
```

不存在的 islandId 返回 `undefined`。

## 默认权限

### `setDefaults(islandId, defaults)`

整体覆盖该岛的 `defaults`。

```js
skyblock.perms.setDefaults(islandId, {
    destroy_block: false,
    place_block: false,
    atk_player: true,
    // ... 必须包含全部节点
});
```

::: warning 是覆盖,不是合并
本方法用传入的对象 **整体替换** defaults。所以要么传入完整对象,要么先 get 再修改某个字段后整体回写。
:::

推荐 pattern:

```js
const cur = skyblock.perms.get(islandId, "defaults");
cur.atk_player = true;
skyblock.perms.setDefaults(islandId, cur);
```

## 世界事件权限

### `setEvents(islandId, events)`

整体覆盖该岛的 `events`(爆炸 / 火焰蔓延 等)。

```js
skyblock.perms.setEvents(islandId, {
    onEntityExplode: false,
    onWitherBossDestroy: false,
    onFireSpread: false,
    onBlockExplode: false,
    onRespawnAnchorExplode: false,
    onFarmLandDecay: false,
});
```

## 白名单(allowlist)

`allowlist` 结构:`{ xuid: [nodeName, nodeName, ...] }`。每个玩家有一个被授权的节点数组。

### `addPermToPlayer(islandId, xuid, node)`

给某玩家添加一个权限节点。

```js
skyblock.perms.addPermToPlayer(islandId, targetXuid, "use_container");
```

- 如果该玩家不在 allowlist 中,会自动创建。
- 重复添加无副作用。
- **不会**校验 node 是否真的存在(传错节点名只是不会生效,不会报错)。

### `removePermFromPlayer(islandId, xuid, node)`

移除某玩家的一个权限节点。

```js
skyblock.perms.removePermFromPlayer(islandId, targetXuid, "use_container");
```

- 节点数组移除后若变空,会自动从 allowlist 删除该 xuid。
- 找不到 xuid 或 node 不在数组中,返回 `false`。

### `setPlayerPerms(islandId, xuid, perms)`

整体覆盖某玩家的权限数组。

```js
skyblock.perms.setPlayerPerms(islandId, targetXuid, ["use_container", "use_door"]);
```

- 传空数组等价于把该玩家从 allowlist 移除。

## 判定语义回顾

把这些数据修改完之后,实际生效顺序见 [权限节点表](./permission-nodes#节点判定流程)。简单说:

```
玩家是 OP+bypass     → 放行
玩家是该岛成员       → 放行(allowlist 完全不查)
allowlist[xuid] 含 node → 放行
defaults[node] = true → 放行
其他情况             → 拦截
```

所以:

- 给岛主添加 allowlist 是没意义的(成员阶段已经放行)。
- `setDefaults({...all true})` 等于"任何人都能做任何事",慎用。
- `setEvents` 与 player 无关,只看坐标。

# skyblock.protect

保护检查接口。在自定义事件 / 自定义保护规则中使用。

## 玩家相关检查

### `checkPerm(player, pos, key)`

检查玩家在某点是否有指定权限。返回 `boolean`。

```js
const ok = skyblock.protect.checkPerm(player, block.pos, "destroy_block");
if (!ok) {
    // 没权限
}
```

判定流程见 [权限节点表](./permission-nodes#节点判定流程)。

### `assertPerm(player, pos, key)`

同 `checkPerm`,但 **不通过时给玩家发 actionbar 提示**(`§c岛屿保护`)。

```js
mc.listen("onMyCustomEvent", (player, pos) => {
    // 直接 return 即可,通过/拦截语义完整
    return skyblock.protect.assertPerm(player, pos, "my_custom_node");
});
```

这是在 `mc.listen` 回调里做权限检查的 **标准写法**——它合并了"检查 + 提示 + 返回拦截值"三件事。

## 世界事件检查

### `checkEventPerm(pos, key)`

检查世界事件(爆炸 / 火焰蔓延 / 凋零破坏 等)在某点是否允许。无 `player` 上下文。

```js
mc.listen("onCustomExplode", (source, pos) => {
    return skyblock.protect.checkEventPerm(pos, "onEntityExplode");
});
```

判定流程比玩家版简单:

```
1. 末地                          → 走全局 end.events
2. 下界且 nether_as_island=false → 走全局 nether.events
3. 坐标在某岛                    → 走该岛 events
4. 不在任何岛                    → 走全局 overworld.events
```

世界事件节点见 [权限节点表 - 世界事件节点](./permission-nodes#世界事件节点-events)。

## 坐标查询

### `findIslandId(pos)`

`pos` → `islandId | null`。和 `skyblock.island.findByPos` 等价。

```js
const id = skyblock.protect.findIslandId({ x: 100, y: 64, z: 200, dimid: 0 });
```

启动期不可用(`rebuildGrid` 之后才有效),详见 [skyblock.island.findByPos](./api-island#findbypos-pos)。

## 实战模式

### 在 `mc.listen` 中加保护

```js
mc.listen("onSomethingCustom", (player, item, block) => {
    // 一行搞定
    return skyblock.protect.assertPerm(player, block.pos, "my_node");
});
```

### 跳过自己的检查给玩家加成员特权

```js
mc.listen("onMyEvent", (player, pos) => {
    // 同岛成员直接放行,不走标准节点判定
    const isl = skyblock.island.getIslandData(player.islandId);
    if (isl?.members?.[player.xuid]) return true;

    return skyblock.protect.assertPerm(player, pos, "my_node");
});
```

但其实标准 `checkPerm` 已经自动放行同岛成员了(优先级第 4 步 a)。这种手写检查通常是不必要的。

### 不依赖节点的自定义规则

如果你想做"在主城禁止 X"这种规则,不必引入新节点,直接判岛屿 id:

```js
const SPAWN_ISLAND_ID = "your_spawn_island_id";

mc.listen("onSomething", (player, pos) => {
    const id = skyblock.protect.findIslandId(pos);
    if (id === SPAWN_ISLAND_ID && !player.isAdmin) {
        player.sendMsg("主城禁止此操作");
        return false;
    }
});
```

详见 [自定义保护规则](./cookbook-protection)。

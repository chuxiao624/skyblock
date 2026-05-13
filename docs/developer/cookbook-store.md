# 跨插件通信

多个扩展之间怎么协同?三种推荐方式。

## 方式 1:Event 总线(松耦合,最推荐)

一个扩展 `emit`,其他扩展按需 `on`。

```js
// 经济插件:每次转账时通知
skyblock.Event.emit("economy:transferred", {
    from: alice.xuid,
    to:   bob.xuid,
    amount: 100,
});

// 排行榜插件:订阅这个事件累计排行
skyblock.Event.on("economy:transferred", ({ from, to, amount }) => {
    updateRankings(from, -amount);
    updateRankings(to, +amount);
});
```

特点:

- 完全解耦,不知道彼此存在
- 多个订阅者都会被通知
- 缺点:返回值不会被收集(只能"通知",不能"问")

[详见 skyblock.Event](./api-event)。

## 方式 2:Store 函数注册

一个扩展把函数挂到 `Store` 上,其他扩展按名调用。

```js
// level.js
skyblock.Store.register("islandLevel:get",
    (islandId) => ranking[islandId] || 0, true);

// challenges.js
const lv = skyblock.Store.call("islandLevel:get", player.islandId) ?? 0;
```

特点:

- 类似 RPC 调用
- 有返回值
- 调用未注册的 name 安全(返回 `undefined`,不抛错)
- 适合"提供查询能力"

[详见 skyblock.Store](./api-store)。

## 方式 3:Store KV 数据

直接共享数据,不通过函数。

```js
// 设置插件版本
skyblock.Store.set("myplugin:version", "1.0.0");

// 其他扩展检测
if (skyblock.Store.has("myplugin:version")) {
    // myplugin 已加载
}
```

特点:

- 比函数注册更轻
- 但所有数据都是"全局可见、可改",**没有访问控制**
- 适合"标志位"、"小配置"

## 实战:可选依赖

你想做一个挑战插件,**如果** 装了 `level` 扩展就支持"等级达成挑战",**没装** 就跳过这种挑战类型。

```js
// challenges.js 中
registerChecker('level', (player, params) => {
    if (!skyblock.Store.has("islandLevel:get")) {
        return { ok: false, msg: "等级系统未启用" };
    }
    const lv = skyblock.Store.call("islandLevel:get", player.islandId) ?? 0;
    if (lv < params.level) {
        return { ok: false, msg: `等级不足 ${lv}/${params.level}` };
    }
    return { ok: true };
});
```

`Store.has` 优雅检测,不强依赖加载顺序。

## 实战:把数据暴露给管理 GUI

`playerinfo.js` 的设计模式:

```js
// playerinfo.js
const _cache = {};   // xuid → { name, xuid, lastSeen }

mc.listen("onJoin", (player) => {
    _cache[player.xuid] = {
        name:     player.realName,
        xuid:     player.xuid,
        lastSeen: Date.now(),
    };
    _file.set("data", _cache);
});

// 暴露查询
skyblock.Store.register("playerinfo:getAll",
    () => Object.values(_cache), true);
skyblock.Store.register("playerinfo:get",
    (xuid) => _cache[xuid] || null, true);
```

```js
// admin/player-mgr.js 消费
const all = skyblock.Store.call("playerinfo:getAll") || [];
```

这样 `admin` 模块不直接访问 `playerinfo` 的内部缓存,只通过 Store 函数接口。

## 实战:扩展插件触发自己的事件

```js
// shop.js
function processPurchase(player, item, price) {
    // ...扣钱、发物...

    // 通知其他插件:有人买东西了
    skyblock.Event.emit("shop:purchased", {
        xuid:  player.xuid,
        item:  item,
        price: price,
    });
}
```

```js
// achievements.js
skyblock.Event.on("shop:purchased", ({ xuid }) => {
    incrementCounter(xuid, "shop_purchase_count");
});
```

## 选哪个

| 我想... | 用 |
| --- | --- |
| 让别人知道"发生了X" | `Event.emit` |
| 让别人能"问我X" | `Store.register` |
| 共享一个标志或小配置 | `Store.set` |
| 检测对方存在 | `Store.has` |
| 共享大块状态 / 实时更新 | `Event.emit`(配合数据载荷) |

## 反模式:不要直接挂全局变量

```js
// ❌ 不推荐
globalThis.myPlugin = { ... };

// 其他扩展
globalThis.myPlugin.foo();
```

问题:

- 没有 force 检测,容易被覆盖
- 没有错误兜底(调用未挂的对象抛错)
- 让 globalThis 越来越脏

走 `Store` 或 `Event` 总线更稳妥。

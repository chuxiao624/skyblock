# skyblock.Store

跨插件共享的 KV 容器,以及"函数注册 / 调用"机制。

设计为"扩展间通信的中介",内部代码不依赖它。

## KV 数据

### `set(key, value, force?)`

写入数据。

```js
skyblock.Store.set("myplugin:version", "1.0.0");
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `key` | `string` | key 建议加插件前缀 |
| `value` | `any` | 任意值 |
| `force` | `boolean` | 是否强制覆盖,默认 `false` |

::: warning 默认拒绝覆盖
如果 key 已存在且 `force=false`,**本次写入被忽略**,并打 warn 日志。这是防止多个插件无意识地踩对方的数据。

需要覆盖时传 `true`:

```js
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);
```
:::

### `get(key)`

读取数据。

```js
const v = skyblock.Store.get("myplugin:version");
```

不存在返回 `undefined`。

### `has(key)`

是否存在(数据 **或** 函数)。

```js
if (skyblock.Store.has("islandLevel:get")) {
    // level.js 插件已加载
}
```

## 函数注册

### `register(name, fn, force?)`

把一个函数挂到 `Store` 上,让其他插件可以通过 `call` 调用。

```js
// 在 myplugin.js 中
skyblock.Store.register("myplugin:doSomething", (arg1, arg2) => {
    return arg1 + arg2;
});
```

`force` 语义同 `set`:默认拒绝覆盖。

### `call(name, ...args)`

调用其他插件注册的函数。

```js
// 在另一个插件 / 模块中
const result = skyblock.Store.call("myplugin:doSomething", 1, 2);
// 3
```

特性:

- 未注册的 name 返回 `undefined`(不抛错)。
- 函数抛异常被捕获,打 `error` 日志,返回 `undefined`。

## 实战模式

### 一个插件给另一个插件提供查询

`level.js` 暴露查询接口:

```js
skyblock.Store.register("islandLevel:get",
    (islandId) => ranking[islandId] || 0, true);
```

`challenges.js` 使用:

```js
const lv = skyblock.Store.call("islandLevel:get", player.islandId) ?? 0;
if (lv < params.level) {
    return { ok: false, msg: `等级不足` };
}
```

### 一个插件给其他插件提供数据

`playerinfo.js` 缓存玩家信息:

```js
skyblock.Store.register("playerinfo:getAll",
    () => Object.values(_cache), true);
skyblock.Store.register("playerinfo:get",
    (xuid) => _cache[xuid] || null, true);
```

`admin/player-mgr.js` 使用:

```js
const all = skyblock.Store.call("playerinfo:getAll") || [];
```

### 给 /is help 追加自己的内容

`Store.get("help")` 是一个累积字符串,所有内置命令在加载时各自追加,扩展也应该这样做:

```js
const ext = "\n§e/is mycmd §7- 我的命令";
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);
```

### 优雅探测可选依赖

```js
if (skyblock.Store.has("islandLevel:get")) {
    // level.js 启用了,我可以做等级相关的事
} else {
    // 不强依赖 level.js,退化处理
}
```

## 命名约定

为避免冲突,推荐:

- KV key:`"<插件名>:<字段>"`,如 `"economy:taxRate"`、`"shop:catalog"`。
- 函数 name:`"<插件名>:<动词>"`,如 `"economy:transfer"`、`"shop:listItems"`。

**`help` 是个例外**,它是 SkyBlock 约定的公共 key,所有命令都直接往里加。

## Store 是内存的,不是持久化的

**`Store` 不写盘**,重启后清空。如果你要持久化数据,自己用 `JsonConfigFile`(参考 `playerinfo.js` 的实现)。

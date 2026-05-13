# skyblock.Event

内部事件总线。区别于 LSE 的 `mc.listen`,本总线提供 **两套独立语义**。

## 两套语义

| API | 用途 | 返回值约定 |
| --- | --- | --- |
| `guard(name, fn)` / `check(name, ...args)` | **权限守卫**(白名单语义)。任意一个 fn 返回 `true` 即放行;无监听者时默认放行 | fn 返回 `boolean`,`check` 返回 `boolean` |
| `on(name, fn)` / `emit(name, ...args)` | **广播通知**。所有监听都会被调用,异常单独捕获,不收集返回值 | fn 不需要 return |

简单记忆:

- **想判断"能不能"** → `guard / check`
- **想知道"发生了什么"** → `on / emit`

## 守卫(guard / check)

### 语义

```
guards = [fn1, fn2, fn3, ...]

check(name, ...args):
    if guards 为空:               return true
    if 任意 fn(args) === true:    return true   ← 白名单语义
    return false
```

注意:`fn` 必须严格返回 `true` 才算放行;返回 `false` / `undefined` / 抛异常都不算。

### 注册

```js
skyblock.Event.guard("onCustomThing", (player, pos) => {
    if (player.isAdmin) return true;       // 放行
    return false;                          // 不放行(让其他 guard 有机会)
});
```

### 触发

```js
const ok = skyblock.Event.check("onCustomThing", player, somePos);
if (!ok) {
    // 没通过,可能要拦截动作
}
```

### 实战例子(内置)

`modules/protection/block.js` 把 LSE 事件转发到内部 guard:

```js
mc.listen("onDestroyBlock", (player, block) =>
    skyblock.Event.check("onDestroyBlock", player, block));

skyblock.Event.guard("onDestroyBlock", (player, block) => {
    return skyblock.protect.assertPerm(player, block.pos, "destroy_block");
});
```

这种"先转发到 EventBus,再注册一个 guard 做实际检查"的模式让 **多个插件可以叠加规则**——任意一个返回 true 就放行。

## 广播(on / emit)

### 语义

```
hooks = [fn1, fn2, fn3, ...]

emit(name, ...args):
    for fn in hooks:
        try { fn(args) } catch (e) { logger.error(e) }
```

异常被吞掉(打日志),不影响后续监听者。

### 注册

```js
skyblock.Event.on("island:created", (xuid, islandId, range, template) => {
    const p = mc.getPlayer(xuid);
    p?.sendMsg(`欢迎来到岛屿 ${islandId}!`);
});
```

### 触发

```js
skyblock.Event.emit("island:created", xuid, islandId, range, template);
```

业务代码很少需要自己 `emit`——内置 services 已经在所有关键时刻 emit 了。

## 内置事件清单

详见 [事件清单](./events)。这里列几个最常用的:

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `island:created` | 玩家创建岛屿后 | `(xuid, islandId, range, template)` |
| `island:removed` | 岛屿被解散 / 强删 | `({ islandId, owner, members })` |
| `island:memberJoined` | 成员加入 | `({ islandId, xuid })` |
| `island:memberLeft` | 成员离开 | `({ islandId, xuid })` |
| `island:transferred` | 转让岛主 | `({ islandId, oldOwner, newOwner })` |
| `player:enterIsland` | 玩家进入某岛(物理位置) | `(player, islandId)` |
| `player:leaveIsland` | 玩家离开某岛(物理位置) | `(player, islandId)` |
| `player:stayOnIsland` | 玩家持续在某岛(每 tick) | `(player, islandId)` |

## 自定义事件

你的扩展可以定义自己的事件名,通过 `emit` 让其他扩展订阅:

```js
// 在你的扩展中
skyblock.Event.emit("myplugin:somethingHappened", payload);
```

其他扩展:

```js
skyblock.Event.on("myplugin:somethingHappened", (payload) => {
    // ...
});
```

**事件名建议加 `<插件名>:` 前缀** 避免与内置事件命名冲突。

## listen(已弃用)

老代码可能调用 `Event.listen(name, fn)`——这是兼容 API,同时调用 `guard` 和 `on`。新代码不要用,**显式选择 `guard` 或 `on`** 更清楚。

```js
// 不要这样
skyblock.Event.listen("foo", fn);

// 改成
skyblock.Event.on("foo", fn);
// 或
skyblock.Event.guard("foo", fn);
```

## 异常处理

| 容器 | 行为 |
| --- | --- |
| `guard` 回调抛异常 | 视为返回 false(不通过),打 `error` 日志 |
| `on` 回调抛异常 | 静默吞掉,打 `error` 日志,**继续调用后续 hooks** |

所以一个有 bug 的扩展不会阻塞总线,但你需要看控制台才能发现问题。日志 tag 是 `EventBus`。

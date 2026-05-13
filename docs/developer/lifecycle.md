# 启动生命周期

理解启动顺序对扩展插件很重要 —— 在 `loadPlugins` 之前的状态、之后的状态完全不同。

## 完整时序

```
[BDS 启动]
   │
[LeviLamina 加载所有插件]
   │
[LSE-QuickJS 执行 skyblock.js]
   │
   ├─ import core/* 装配基础设施
   │  ├─ Config 读 runtime/config/config.json
   │  ├─ I18n 读 lang/<lang>.json
   │  ├─ PermsCfg 读 runtime/config/permissions.json
   │  ├─ IslandRepo 读 islands.json / index.json
   │  ├─ PermRepo 读 runtime/permissions.json + _migrate
   │  ├─ WarpRepo 读 warps.json
   │  ├─ ProxyRepo 读 admin_proxy.json
   │  └─ Coord 读 coord.json
   │
   ├─ import api/* → 挂 globalThis.skyblock.*
   ├─ import api/player.js → LLSE_Player 原型扩展
   │
   ├─ import modules/* → 注册 LSE 事件监听 + 命令(还未 setup)
   │  ├─ protection/* → mc.listen + Event.guard
   │  ├─ commands/* → Command.registerAll
   │  ├─ warp/* → mc.listen + Command.registerAll
   │  ├─ tracker.js → mc.listen("onLeft") + setInterval
   │  └─ nether.js → Event.on("island:created", ...)
   │
   ├─ loadStructures()                          ← 同步 templates 到 BDS
   │
[mc.listen("onServerStarted")] ◀── BDS 完全启动后
   │
   ├─ loadPlugins()                             ← 自动 require plugins/*.js
   │     │
   │     └─ 每个扩展执行 import / 注册命令 / 订阅事件 / ...
   │
   ├─ IslandSvc.rebuildGrid()                   ← 重建 SpatialGrid
   │
   ├─ AdminProxySvc.restore()                   ← 恢复管理员代理状态
   │
   ├─ skyblock.Command.setup()                  ← 注册 /is 主命令(含所有子命令)
   ├─ setupAdminCommand()                       ← 注册 /isa
   ├─ setupTemplateEditorCommand()              ← 注册 /tpl
   │
   └─ log.info("skyblock 已就绪 !")
```

## 时序里的关键节点

### 静态导入期(同步)

所有 `import "plugins/skyblock/..."` 在 LSE 执行 `skyblock.js` 时立即完成,顺序遵循 ES 模块语义。

此时:

- `runtime/*.json` 已全部读入内存。
- LSE 事件已经 `mc.listen` 注册完毕。
- 内置子命令通过 `Command.registerAll` 入库,**但还没 setup**。
- `SpatialGrid` 还是空的(还没 rebuildGrid)。

### `onServerStarted` 之前

如果你在静态导入期就调用 `IslandSvc.findByPos(...)`,会得到 `null` —— SpatialGrid 还没建。

### loadPlugins() 之内

**这是扩展执行的唯一窗口**。在此期间:

- 你可以调用任何 `skyblock.*` API(除了 `findByPos` 还不能用)。
- 你的 `Command.registerAll(...)` 会被记录但还没 setup,所以可以正常注册。
- 你的 `Event.on(...)` / `Event.guard(...)` 立即生效。

如果你的扩展需要在所有岛屿索引就绪之后做事(比如启动时遍历所有岛屿做迁移),不要直接做,应该:

```js
// 错误:此时 grid 还没建
const id = skyblock.protect.findIslandId({ x: 100, z: 200, dimid: 0 });

// 正确:监听一个稍后才触发的钩子(目前没有"启动完成"事件,
// 简单办法是用 mc.listen 或在第一个 player:enterIsland 时再做)
mc.listen("onJoin", (player) => {
    // 此时 grid 已经就绪
});
```

### loadPlugins() 之后的 setup

`skyblock.Command.setup()` 把所有累积的子命令组装成 `mc.newCommand("is", ...)` 并调用 `.setup()` 注册到游戏。

**`setup()` 之后再 `registerAll()` 不会生效**,会有 warn 日志:

```
setup() 已调用,后续 registerAll 不会生效。请提前注册
```

所以扩展必须在 **静态执行期** 注册命令,不能延迟到任何回调里。

## 数据落盘时机

- `Storage.set(key, value)` 写入立即生效,但磁盘 flush 走 **500ms 防抖**(`CONST.STORAGE_FLUSH_MS`)。
- 短时间内多次 `set` 只会触发一次 flush,降低 IO。
- `/isa reload` 时不显式 flush,但 LSE 重新加载脚本之前 JsonConfigFile 通常会刷盘。生产场景建议:**手改 `runtime/*.json` 前先停服**。

## 重启的副作用

| 内存中的状态 | 重启后 |
| --- | --- |
| `Session` 中的邀请 / 解散确认 | 全部清空 |
| `Tracker.playerIslandMap` | 重建,在 tick() 周期内重新填充 |
| `Timer` 上注册的命名定时器 | 全部清空,需要重新启动 |
| `/tpl` 编辑会话 | 全部清空,粒子任务结束 |
| AdminProxy 状态 | **保留**(从 admin_proxy.json 恢复) |
| 邀请到一半的玩家 | 邀请丢失,需要重新发邀请 |
| structure load 队列 | **保留**(由 BDS 自身维护) |

## 关停顺序

LSE 没有显式的 `onShutdown` 钩子接入插件。关停时:

- 所有未 flush 的 `Storage` 会通过 JsonConfigFile 自身的析构落盘。
- 内存状态(`Map`、定时器)全部丢失。
- 想做"关停清理"的话目前没有标准入口。如果有需要,可以用 `mc.listen("onServerStop")`(如果 LSE 暴露了)。

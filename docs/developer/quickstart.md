# 快速开始

写一个 skyblock 扩展只需要做两件事:**新建一个 `.js` 文件,丢进 `plugins/skyblock/plugins/`**。剩下的交给加载器。

## 文件位置

```
plugins/skyblock/plugins/
├─ my_plugin.js              ← 你的扩展(单文件即可)
└─ my_plugin/                ← 如果需要存数据,放这个同名子目录
   └─ data.json
```

服务器启动后,`plugins/` 目录下所有 `.js` 文件会被**自动 `require`**,顺序不保证。

## Hello World

把下面这段保存为 `plugins/skyblock/plugins/hello.js`,重启服务器:

```js
// 1. 注册一个 /is 子命令
skyblock.Command.registerAll({
    "hello": (origin) => {
        const player = origin.player;
        if (!player) return;
        player.sendMsg("Hello from my plugin!");
    },
});

// 2. 监听岛屿创建事件
skyblock.Event.on("island:created", (xuid, islandId) => {
    const p = mc.getPlayer(xuid);
    p?.sendMsg(`欢迎来到岛屿 ${islandId}!`);
});

// 3. 把帮助加进 /is help
const ext = "\n§e/is hello §7- 跟我打招呼";
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);
```

进游戏执行 `/is hello`,会回复 "Hello from my plugin!"。新创建岛屿时也会收到欢迎消息。

## 你能用什么

所有功能都挂在 `globalThis.skyblock` 下:

| 入口 | 用途 |
| --- | --- |
| `skyblock.island` | 创建 / 查询 / 修改岛屿 |
| `skyblock.perms` | 改岛屿权限 |
| `skyblock.protect` | 检查玩家在某点的权限 |
| `skyblock.Event` | 订阅事件 / 触发事件 |
| `skyblock.Command` | 注册 `/is` 子命令 |
| `skyblock.Store` | 跨插件共享数据 / 函数 |
| `skyblock.Session` | TTL 自动过期的临时键值 |
| `skyblock.Timer` | 命名定时器 |
| `skyblock.config` | 读全局配置 |
| `skyblock.i18n` | 多语言 |
| `skyblock.Tracker` | 玩家当前所在的岛 |

完整方法签名见 [API 速查](./api),完整事件列表见 [事件清单](./events)。

LSE 原生 API(`mc.*`、`mc.listen`、`File`、`NBT`、`JsonConfigFile` …)也都能用。

## LLSE_Player 扩展属性

skyblock 在 `LLSE_Player.prototype` 上挂了一些便捷属性,任何 `player` 对象上都能直接用:

```js
player.islandId            // 玩家所属岛 id(没有则 null)
player.island              // 完整岛屿数据
player.isAdmin             // 是否是 SkyBlock 管理员
player.isIslandOwner       // 是否岛主
player.isOnOwnIsland       // 当前是否在自己岛上
player.islandSpawn         // 自己岛的出生点 [x,y,z,dimid]
player.sendMsg(msg)        // 带 [空岛] 前缀的发消息
player.guardOwner()        // "不是岛主就提示并返回 false"
```

完整清单见 [API 速查](./api#llse-player-扩展)。

## 加载顺序

服务器启动时:

```
1. skyblock 核心代码全部装配完成
2. mc.listen("onServerStarted") 触发
3. 你的扩展(plugins/*.js)被一个个 require       ← 这是你执行的窗口
4. SpatialGrid 重建,岛屿索引就绪
5. AdminProxy 状态恢复
6. Command.setup() —— 把所有累积的 /is 子命令注册到游戏
7. log: skyblock 已就绪!
```

## 几个必须知道的坑

### 命令必须在文件顶层注册

`Command.setup()` 在 `loadPlugins()` 完成后立即执行。**你不能在任何回调里再 `registerAll`**。

```js
// 错:此时 setup 已经发生
mc.listen("onJoin", () => {
    skyblock.Command.registerAll({ "x": ... });   // warn:setup() 已调用
});

// 对:文件顶层直接注册
skyblock.Command.registerAll({ "x": ... });
```

### 修改 help 字符串要传 `force=true`

```js
const ext = "\n§e/is xxx §7- ...";
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);
//                                                          ^^^^
// 必须传 true,因为 help 这个 key 已经存在
```

不传会被 Store 拒绝覆盖并打 warn。

### 不要 import 内部模块

```js
// 错:这些是私有目录,版本升级时会变
import { IslandSvc } from "plugins/skyblock/src/services/IslandService.js";

// 对:只通过 globalThis.skyblock
const data = skyblock.island.getIslandData(islandId);
```

### 加载顺序不保证

你的扩展加载时,其他扩展可能还没加载完。需要协作就用 `Store.has` 探测:

```js
if (skyblock.Store.has("islandLevel:get")) {
    const lv = skyblock.Store.call("islandLevel:get", player.islandId);
}
```

### `findByPos` 在静态导入期不可用

`skyblock.protect.findIslandId(pos)` 依赖 SpatialGrid,SpatialGrid 在你的扩展执行**之后**才重建。

- 在 `mc.listen` / `Event.on` 等回调里调用 → 安全(那时已经就绪)
- 在文件顶层直接调用 → 返回 `null`

## 数据持久化

`Store` 是内存的,**重启就没了**。要持久化用 LSE 的 `JsonConfigFile`:

```js
const FILE = new JsonConfigFile("./plugins/skyblock/plugins/myplugin/data.json", "{}");
const data = FILE.init("myKey", {});

// 改完写盘
FILE.set("myKey", data);
```

放自己专属的子目录(`plugins/skyblock/plugins/myplugin/`),不要往 `runtime/` 里塞东西 —— 那是核心数据目录。

## 下一步

- 完整 API 怎么用 → [API 速查](./api)
- 我能监听 / 触发什么事件 → [事件清单](./events)
- 权限节点名怎么填 → [权限节点表](./permission-nodes)
- 一些实战例子 → [实战示例](./recipes)

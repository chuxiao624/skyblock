# 写一个扩展插件

第三方扩展是为 SkyBlock 添加新玩法的标准方式。

## 把文件放对位置

第三方扩展放在:

```
plugins/skyblock/plugins/<你的插件>.js
```

::: tip 配套数据放子目录
如果你的插件需要持久化自己的数据,建议这样组织:

```
plugins/skyblock/plugins/
├─ myplugin.js                ← 入口
└─ myplugin/
   ├─ data.json               ← 配置(腐竹手改)
   └─ player.json             ← 运行时数据(代码维护)
```

参考内置 `challenges.js` + `challenges/data/*.json` 的布局。
:::

## 加载机制

服务器启动期间,`Bootstrap.js` 的 `loadPlugins()` 会:

```js
const list = File.getFilesList("./plugins/skyblock/plugins") || [];
for (const name of list) {
    if (name.endsWith(".js")) {
        require(`./skyblock/plugins/${name}`);
    }
}
```

- 只加载 **顶层 `.js` 文件**,不递归子目录。
- 每个文件单独 `require`,异常被捕获,**不会因为一个扩展挂掉影响其他扩展**。
- 加载时机:`onServerStarted` 事件触发后,**早于命令注册**。所以你的扩展可以在执行期注册子命令、订阅事件。

## 一个最小例子

```js
// plugins/skyblock/plugins/hello.js

// 1. 注册一个子命令: /is hello
skyblock.Command.registerAll({
    "hello": (origin) => {
        const player = origin.player;
        if (!player) return;
        player.sendMsg("Hello from my plugin!");
    },
});

// 2. 监听岛屿创建事件
skyblock.Event.on("island:created", (xuid, islandId, range, template) => {
    const p = mc.getPlayer(xuid);
    p?.sendMsg(`你创建了岛屿 ${islandId},加油!`);
});

// 3. 把帮助补到 /is help 输出
const ext = "\n§e/is hello §7- 跟我打招呼";
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);
```

把这段代码保存为 `plugins/skyblock/plugins/hello.js`,启动服务器即生效。

## 能用什么

通过 `globalThis.skyblock` 访问:

| 命名空间 | 用途 | 文档 |
| --- | --- | --- |
| `skyblock.island` | 岛屿数据 / 操作 | [api-island](./api-island) |
| `skyblock.perms` | 权限编辑 | [api-perms](./api-perms) |
| `skyblock.protect` | 保护检查 | [api-protect](./api-protect) |
| `skyblock.Command` | 注册 `/is` 子命令 | [api-command](./api-command) |
| `skyblock.Event` | 事件订阅 / 守卫 | [api-event](./api-event) |
| `skyblock.Store` | 跨插件 KV / 函数 | [api-store](./api-store) |
| `skyblock.Session` | TTL 临时键值 | [api-session](./api-session) |
| `skyblock.Timer` | 命名定时器 | [api-timer](./api-timer) |
| `skyblock.config` | 全局配置 | - |
| `skyblock.i18n` | 多语言 | [api-i18n](./api-i18n) |
| `skyblock.Tracker` | 玩家位置查询 | - |

还有 LLSE_Player 原型扩展(`player.islandId / islandSpawn / guardOwner / sendMsg ...`),详见 [LLSE_Player 扩展](./api-player)。

LSE 原生 API(`mc.*`、`mc.listen`、`File`、`NBT`、`JsonConfigFile` ...)也照常可用。

## 几条注意事项

### 不要 import 内部文件

扩展应该 **只通过 `globalThis.skyblock`** 访问内置能力。`plugins/skyblock/src/` 下的 services / repos / core 都是私有的,版本升级时签名可能变化。

### 异常自己处理

`loadPlugins()` 会捕获 `require()` 期间的异常,但 **执行期** 的异常(在事件回调、命令处理、定时器等里)会被对应的容器吞掉:

- `Event.on` / `Event.guard` 的回调异常被 EventBus 捕获并打日志。
- `Command.registerAll` 的回调异常被 Command 捕获并打日志。

你看不到错误的话,先去看控制台,日志 tag 通常是 `EventBus` / `Command` / 你扩展自己的 `Logger`。

### 不要假设加载顺序

你的扩展加载时 **其他扩展可能还没加载**(`File.getFilesList` 顺序不保证)。需要协作的场景:

- 用 `skyblock.Store.register` 暴露能力,而不是依赖其他扩展提前挂好的全局变量。
- 用 `skyblock.Event.on("island:created", ...)` 而不是直接读取 `islands.json`。

### 自有命令也走 /is

不要 `mc.newCommand("mycmd", ...)` 单独注册命令——玩家要记额外的前缀。

正确做法:

```js
skyblock.Command.registerAll({
    "mycmd": (origin) => { ... },
});
```

这样玩家用 `/is mycmd`,所有 SkyBlock 相关命令都在一个命名空间下。

[详见 skyblock.Command](./api-command)。

### 帮助文本要补进 Store

`/is help` 的内容存在 `skyblock.Store.get("help")` 字符串里。新加子命令记得追加描述:

```js
const ext = "\n§e/is yourcmd §7- 一行描述";
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);
```

第三个参数 `true` 是 force 覆盖,这里必须传(因为 `help` 这个 key 已经存在了)。

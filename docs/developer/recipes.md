# 实战示例

几个常见任务的完整可复制代码。

## 注册新的子命令

最常见的扩展需求。

### 简单命令(无参数)

```js
// plugins/skyblock/plugins/hello.js

skyblock.Command.registerAll({
    "hello": (origin) => {
        const player = origin.player;
        if (!player) return;
        player.sendMsg("Hello!");
    },
});

skyblock.Store.set("help",
    skyblock.Store.get("help") + "\n§e/is hello §7- 打招呼", true);
```

### 带参数和枚举

```js
skyblock.Command.registerAll({
    "shop": {
        enums: {
            shop_action: ["open", "close", "reload"],
        },
        params: {
            shop_target: { type: ParamType.String, optional: true },
        },
        overloads: [
            ["shop_action"],
            ["shop_action", "shop_target"],
        ],
        callback: (origin, output, results) => {
            const player = origin.player;
            if (!player) return;
            switch (results.shop_action) {
                case "open":   return openShop(player, results.shop_target);
                case "close":  return closeShop(player);
                case "reload": return reloadShop(player);
            }
        },
    },
});

skyblock.Store.set("help",
    skyblock.Store.get("help") +
    "\n§e/is shop open|close|reload §a[target] §7- 商店", true);
```

::: warning 必须在文件顶层注册
`Command.setup()` 在 `loadPlugins()` 完成后立即调用一次。**之后再 `registerAll` 不会生效**。所以你的 `Command.registerAll(...)` 必须直接写在文件最外层,不能延迟到任何回调里。
:::

---

## 自定义保护规则

### 三种思路对比

| 想做的事 | 用哪个 |
| --- | --- |
| 在标准检查的基础上 **额外放行** 某些情况(如 VIP 豁免) | `skyblock.Event.guard` |
| 在标准检查通过后 **额外拦截**(如博物馆禁止破坏) | `mc.listen` + 直接 return false |
| 只想 **观察 / 记录**,不干预 | `skyblock.Event.on` |

### VIP 玩家在任何地方都能放方块

利用"可拦截"事件的白名单语义 —— 任意一个 fn 返回 `true` 即放行,所以你的 `true` 会**叠加在内置规则之上**:

```js
skyblock.Event.guard("onPlaceBlock", (player, block) => {
    if (player.getTag?.("vip")) return true;   // VIP 豁免
    return false;                              // 让标准守卫继续判
});
```

### 博物馆区域禁止破坏(连岛主也不行)

白名单语义没法"否决"别人的放行,所以**用 `mc.listen` 直接拦截**:

```js
const MUSEUM_ISLAND_ID = "abc123def456...";

mc.listen("onDestroyBlock", (player, block) => {
    if (player.isAdmin) return;   // 管理员豁免

    const id = skyblock.protect.findIslandId(block.pos);
    if (id === MUSEUM_ISLAND_ID) {
        player.tell("§c博物馆禁止破坏", 4);
        return false;             // 拦截
    }
});
```

`mc.listen` 与内置保护层是 **独立两套监听**,LSE 只要任一个返回 `false` 就拦截动作。

### 记录所有方块破坏

只想旁观,用 `on` 监听后置事件:

```js
skyblock.Event.on("onDestroySignAfter", (player, block) => {
    log.info(`${player.realName} 破坏了 ${block.type} @ ${block.pos}`);
});
```

注意 `onDestroyBlock` 没有对应的 `After` 通知事件,如果你要监听所有破坏后的副作用,得用 `mc.listen("onDestroyBlock", ...)` 不返回(不返回相当于放行)。

---

## 跨插件通信

### 提供查询能力给其他插件

`level.js` 暴露查询接口:

```js
// plugins/skyblock/plugins/level.js
const ranking = {};   // islandId -> level

skyblock.Store.register(
    "islandLevel:get",
    (islandId) => ranking[islandId] || 0,
    true,
);
```

`challenges.js` 使用:

```js
const lv = skyblock.Store.call("islandLevel:get", player.islandId) ?? 0;
if (lv < 50) return player.sendMsg("等级不够");
```

### 优雅检测可选依赖

```js
// 在挑战插件里
if (skyblock.Store.has("islandLevel:get")) {
    // level 插件存在,可以做等级相关功能
    const lv = skyblock.Store.call("islandLevel:get", player.islandId);
} else {
    // level 插件没装,退化处理
}
```

### 发布自定义事件

```js
// shop.js
function processPurchase(player, item, price) {
    player.addMoney?.(-price);
    player.giveItem(item);

    skyblock.Event.emit("shop:purchased", {
        xuid:  player.xuid,
        item:  item.type,
        price: price,
    });
}

// achievements.js(订阅)
skyblock.Event.on("shop:purchased", ({ xuid }) => {
    incrementCounter(xuid, "shop_count");
});
```

事件名加 `<插件名>:` 前缀避免冲突。

---

## 监听岛屿生命周期

### 新岛屿欢迎

```js
skyblock.Event.on("island:created", (xuid, islandId) => {
    const p = mc.getPlayer(xuid);
    p?.setTitle("§a欢迎来到空岛!", 0);
    p?.setTitle("§7祝你玩得愉快", 3);
});
```

### 岛屿解散时清理外部资源

```js
skyblock.Event.on("island:removed", ({ islandId, members }) => {
    // 例:删自己插件中和这个岛屿关联的所有数据
    delete myStorage.byIsland[islandId];
    myFile.set("byIsland", myStorage.byIsland);

    // 通知所有原成员
    for (const xuid of members) {
        mc.getPlayer(xuid)?.sendMsg("§c你所在的岛屿已被删除");
    }
});
```

### 进岛 / 离岛标题提示

```js
skyblock.Event.on("player:enterIsland", (player, id) => {
    const isOwn = player.islandId === id;
    const head  = isOwn ? "§a欢迎回来" : "§a你正在访问";
    const name  = skyblock.island.getIslandName(id) ?? "未命名";
    player.setTitle(head, 2);
    player.setTitle(`§c${name}`, 3);
});

skyblock.Event.on("player:leaveIsland", (player, id) => {
    const name = skyblock.island.getIslandName(id) ?? "未命名";
    player.tell(`你离开了 ${name} 的岛屿`, 4);   // 4 = actionbar
});
```

---

## 持久化数据

`Store` 是内存的,重启就没了。要持久化用 LSE 的 `JsonConfigFile`:

```js
const FILE = new JsonConfigFile(
    "./plugins/skyblock/plugins/myplugin/data.json",
    "{}"
);

const players = FILE.init("players", {});   // 初始化默认值

// 改完写盘
function recordVisit(xuid) {
    players[xuid] = (players[xuid] || 0) + 1;
    FILE.set("players", players);
}
```

放自己专属的子目录(`plugins/skyblock/plugins/<your-plugin>/`),**不要往 `runtime/` 里塞东西**。

---

## 多语言

### 注册自己的文案

```js
skyblock.i18n.register("zh_CN", {
    "myplugin.usage":   "用法: /is mycmd <玩家>",
    "myplugin.done":    "§a完成: {name}",
    "myplugin.no_perm": "§c你没有权限",
});

skyblock.i18n.register("en_US", {
    "myplugin.usage":   "Usage: /is mycmd <player>",
    "myplugin.done":    "§aDone: {name}",
    "myplugin.no_perm": "§cNo permission",
});
```

### 使用

```js
player.sendMsg(skyblock.i18n.tr("myplugin.done", { name: target }));
```

key 用 `<插件名>.` 前缀,避免与内置文案冲突。

---

## 完整最小示例

一个集成了上面多种能力的完整扩展模板,保存为 `plugins/skyblock/plugins/welcome.js` 即可运行:

```js
// 多语言
skyblock.i18n.register("zh_CN", {
    "welcome.first_island": "§a恭喜创建你的第一个岛屿: §e{name}",
    "welcome.cmd_count":    "§b你已经在岛上停留过 §e{n} §b次",
});

// 持久化
const FILE = new JsonConfigFile(
    "./plugins/skyblock/plugins/welcome/data.json", "{}"
);
const visits = FILE.init("visits", {});   // xuid -> 次数

// 监听创建岛屿
skyblock.Event.on("island:created", (xuid, islandId) => {
    const p = mc.getPlayer(xuid);
    p?.sendMsg(skyblock.i18n.tr("welcome.first_island",
        { name: skyblock.island.getIslandName(islandId) }));
});

// 监听进岛(节流)
const STAY_MIN = 60_000;   // 1 分钟
const _last = new Map();
skyblock.Event.on("player:enterIsland", (player, id) => {
    if (player.islandId !== id) return;          // 只算回自己家
    const now = Date.now();
    if (now - (_last.get(player.xuid) ?? 0) < STAY_MIN) return;
    _last.set(player.xuid, now);

    visits[player.xuid] = (visits[player.xuid] || 0) + 1;
    FILE.set("visits", visits);
});

// 命令查询
skyblock.Command.registerAll({
    "visits": (origin) => {
        const p = origin.player;
        if (!p) return;
        const n = visits[p.xuid] || 0;
        p.sendMsg(skyblock.i18n.tr("welcome.cmd_count", { n }));
    },
});

// 帮助文本
skyblock.Store.set("help",
    skyblock.Store.get("help") + "\n§e/is visits §7- 查看你回家次数", true);
```

这个例子涵盖了:**多语言注册 / 持久化 / 事件监听 + 节流 / 命令注册 / 帮助文本追加**。基本能作为新扩展的起点模板。

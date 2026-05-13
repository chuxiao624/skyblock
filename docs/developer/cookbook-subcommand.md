# 注册新的子命令

最常见的扩展需求:给 `/is` 加一个新命令。

## 简单命令(无参数)

```js
// plugins/skyblock/plugins/hello.js

skyblock.Command.registerAll({
    "hello": (origin) => {
        const player = origin.player;
        if (!player) return;
        player.sendMsg("Hello!");
    },
});

const ext = "\n§e/is hello §7- 打招呼";
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);
```

使用:`/is hello`。

## 带参数

```js
skyblock.Command.registerAll({
    "greet": {
        params: { greet_target: ParamType.String },
        overloads: [["greet_target"]],
        callback: (origin, output, results) => {
            const player = origin.player;
            if (!player) return;
            const target = results.greet_target;
            player.sendMsg(`Hello, ${target}!`);
        },
    },
});
```

使用:`/is greet Alice`。

## 带枚举(子动作)

```js
skyblock.Command.registerAll({
    "shop": {
        enums: {
            shop_action: ["open", "close", "reload"],
        },
        overloads: [["shop_action"]],
        callback: (origin, output, results) => {
            const action = results.shop_action;
            switch (action) {
                case "open":   return openShop(origin.player);
                case "close":  return closeShop(origin.player);
                case "reload": return reloadShop(origin.player);
            }
        },
    },
});
```

使用:`/is shop open` / `/is shop close` / `/is shop reload`。

## 多重载(枚举 + 可选参数)

```js
skyblock.Command.registerAll({
    "pay": {
        params: {
            pay_target: ParamType.String,
            pay_amount: { type: ParamType.Int, optional: true },
        },
        overloads: [
            ["pay_target"],                  // /is pay <target>(查询)
            ["pay_target", "pay_amount"],   // /is pay <target> <amount>(转账)
        ],
        callback: (origin, output, results) => {
            const player = origin.player;
            if (!player) return;
            if (results.pay_amount == null) {
                return queryBalance(player, results.pay_target);
            }
            return transfer(player, results.pay_target, results.pay_amount);
        },
    },
});
```

## 完整模板(推荐风格)

```js
// plugins/skyblock/plugins/myplugin.js

// 1. 注册多语言
skyblock.i18n.register("zh_CN", {
    "myplugin.no_perm":   "§c你没有权限",
    "myplugin.done":      "§a操作完成: {name}",
    "myplugin.usage":     "§e/is mycmd <action> [target]",
});

// 2. 实现处理函数
function handleAction(player, action, target) {
    if (!player.isAdmin) return player.sendMsg(skyblock.i18n.tr("myplugin.no_perm"));
    // 业务逻辑...
    player.sendMsg(skyblock.i18n.tr("myplugin.done", { name: target }));
}

// 3. 注册命令
skyblock.Command.registerAll({
    "mycmd": {
        enums:    { my_action: ["foo", "bar"] },
        params:   { my_target: { type: ParamType.String, optional: true } },
        overloads: [
            ["my_action"],
            ["my_action", "my_target"],
        ],
        callback: (origin, output, results) => {
            const p = origin.player;
            if (!p) return;
            handleAction(p, results.my_action, results.my_target);
        },
    },
});

// 4. 追加帮助
const ext = "\n§e/is mycmd foo|bar §a[target] §7- 我的命令";
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);
```

## 注意事项

### 必须在文件顶层注册

`Command.setup()` 在 `loadPlugins()` 完成后立即执行。你不能延迟到任何回调里再注册:

```js
// ❌ 错误:setup 已经发生了
mc.listen("onJoin", () => {
    skyblock.Command.registerAll({ "x": ... });   // warn:setup() 已调用
});

// ✅ 正确:文件顶层执行
skyblock.Command.registerAll({ "x": ... });
```

### 子命令名冲突

`registerAll` 不会覆盖已存在的同名子命令,只会打 warn:

```
子命令 "create" 已注册,跳过
```

如果你想替换内置命令的行为,目前没有标准方式。可以:

- 把内置 `create` 包装一层(在自己的钩子里调用)
- 或者用 `mc.listen` 拦截命令(不推荐)

### `origin.player` 可能为 null

控制台执行 `/is xxx` 时,`origin.player` 是 null。需要的话先 guard:

```js
callback: (origin, output, results) => {
    const player = origin.player;
    if (!player) {
        output.error("此命令仅限玩家执行");
        return;
    }
    // ...
}
```

### 帮助文本必须 force=true

`help` 这个 key 默认已经存在(由内置 `commands/island.js` 初始化),追加时必须传 `force=true`:

```js
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);
//                                                          ^^^^
```

否则 Store 会拒绝覆盖并打 warn。

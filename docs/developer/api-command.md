# skyblock.Command

`/is` 子命令注册器。所有玩家命令统一挂在 `/is <子命令>` 下,**不要单独 `mc.newCommand`**。

## registerAll(map)

批量注册子命令。

### 简写形式(无参数)

```js
skyblock.Command.registerAll({
    "hello": (origin) => {
        const player = origin.player;
        if (!player) return;
        player.sendMsg("Hello!");
    },
});
```

使用:

```
/is hello
```

### 完整形式(带参数 / 枚举 / 重载)

```js
skyblock.Command.registerAll({
    "warp": {
        enums:   { warp_action: ["list", "public", "toggle"] },
        params:  { warp_name: { type: ParamType.String, optional: true } },
        overloads: [
            ["warp_action"],
            ["warp_action", "warp_name"],
        ],
        callback: (origin, output, results) => {
            const action = results.warp_action;
            const name = results.warp_name;
            // ...
        },
    },
});
```

字段说明:

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `enums` | `Record<string, string[]>` | 枚举参数,key 是参数名,value 是候选列表 |
| `params` | `Record<string, ParamType \| {type, optional}>` | 普通参数声明 |
| `overloads` | `Array<string[]>` | 命令重载,每个数组列出该重载用到的参数名顺序 |
| `callback` | `(origin, output, results) => void` | 处理函数,`results.<name>` 取参数值 |

每个 overload 前面会自动塞入"子命令本身"的 enum,所以 `overloads` 数组里 **不需要写子命令名本身**。

## 触发时机

::: warning 必须在 setup() 之前注册
`Command.setup()` 在所有扩展加载完毕后由入口统一调用一次。**之后再 `registerAll` 不会生效**,会有 warn 日志。

正确做法:在你的扩展文件 **顶层**(静态执行期)立即注册,不要延迟到任何回调里。
:::

## runIs

`/is` 不带任何子命令时执行的 fallback。默认行为是显示帮助。如果你想覆盖:

```js
skyblock.Command.runIs = (origin) => {
    const player = origin.player;
    if (!player) return;
    // 自定义"光打 /is"时的行为,例如打开主菜单 GUI
    openMainGui(player);
};
```

::: tip 谁先 set 谁赢
`runIs` 是单值,后赋值会覆盖前者。如果多个扩展都改它,只有最后一个生效。建议生产环境不要随便改这个 fallback,会破坏玩家直觉。
:::

## 帮助文本

所有命令的帮助内容存在 `skyblock.Store.get("help")` 字符串里。当 `/is help` 或 `/is`(默认 fallback) 被触发时显示。

你新加的子命令应该把自己的帮助 **追加** 进去:

```js
const ext = "\n§e/is hello §7- 跟我打招呼";
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);
//                                                          ^^^^
// 必须传 force=true,因为 help 已经存在
```

## 完整示例

```js
// plugins/skyblock/plugins/economy.js

import 不需要,直接用 skyblock.* 即可

skyblock.Command.registerAll({
    "pay": {
        params: {
            pay_target: ParamType.String,
            pay_amount: ParamType.Int,
        },
        overloads: [["pay_target", "pay_amount"]],
        callback: (origin, output, results) => {
            const player = origin.player;
            if (!player) return;
            const targetName = results.pay_target;
            const amount = results.pay_amount;
            if (amount <= 0) {
                return player.sendMsg("金额必须为正");
            }
            // 实际转账逻辑...
            player.sendMsg(`已向 ${targetName} 转账 ${amount}`);
        },
    },

    "balance": (origin) => {
        const player = origin.player;
        if (!player) return;
        const balance = player.getMoney?.() ?? 0;
        player.sendMsg(`你的余额: ${balance}`);
    },
});

const ext = "\n§e/is pay §a<玩家> <金额> §7- 转账\n§e/is balance §7- 查看余额";
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);
```

注册后 `/is pay chuxiao 100` / `/is balance` 立即可用。

## origin / output / results

回调签名 `(origin, output, results) => void`,这三个是 LSE 标准命令处理参数。

| 名 | 含义 |
| --- | --- |
| `origin` | 命令来源,常用 `origin.player`(可能为 null,例如控制台执行) |
| `output` | 输出器,常用 `output.error("...")` 或 `output.success("...")` 发结果 |
| `results` | 参数结果对象,按你声明的参数名取值 |

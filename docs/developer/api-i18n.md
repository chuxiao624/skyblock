# skyblock.i18n

多语言。支持文件加载 + 热注册。

## 基础 API

### `tr(key, vars?)`

翻译。`key` 找不到时 **返回 key 本身**(不抛错)。

```js
skyblock.i18n.tr("cmd.create.success");
// "§a岛屿创建完成,开始生存吧!"
```

带占位符:

```js
skyblock.i18n.tr("cmd.invite.received", { name: "chuxiao" });
// "§echuxiao 邀请你加入他的岛屿..."
```

占位符语法:`{varName}`。变量未提供时保留为 `{varName}` 字面量(便于调试)。

### `setLang(lang)`

切换语言。如果该语言还没读入内存,会从 `lang/<lang>.json` 加载。

```js
skyblock.i18n.setLang("en_US");
```

同时把 `lang` 字段写入 `config.json`,重启后保持。

### `getLang()`

返回当前语言代码,如 `"zh_CN"`。

## 注册自己的语言包

### `register(lang, messages)`

把一组 key/value 合并到指定语言。同名 key 会被覆盖。

```js
skyblock.i18n.register("zh_CN", {
    "myplugin.hello":   "你好,{name}!",
    "myplugin.goodbye": "再见,{name}!",
});

skyblock.i18n.register("en_US", {
    "myplugin.hello":   "Hello, {name}!",
    "myplugin.goodbye": "Goodbye, {name}!",
});

const msg = skyblock.i18n.tr("myplugin.hello", { name: "chuxiao" });
```

## 实战模式

### 在扩展插件里完整国际化

推荐结构:

```js
// plugins/skyblock/plugins/myplugin.js

skyblock.i18n.register("zh_CN", {
    "myplugin.start":  "插件已启动",
    "myplugin.usage":  "用法: /is mycmd <玩家>",
    "myplugin.done":   "操作完成: {name}",
});
skyblock.i18n.register("en_US", {
    "myplugin.start":  "Plugin started",
    "myplugin.usage":  "Usage: /is mycmd <player>",
    "myplugin.done":   "Done: {name}",
});

skyblock.Command.registerAll({
    "mycmd": {
        params: { mycmd_target: ParamType.String },
        overloads: [["mycmd_target"]],
        callback: (origin, output, results) => {
            const p = origin.player;
            if (!p) return;
            const name = results.mycmd_target;
            // ...
            p.sendMsg(skyblock.i18n.tr("myplugin.done", { name }));
        },
    },
});
```

这样代码里只出现 i18n key,文案改动不用动逻辑代码。

### 给外部语言文件留扩展空间

如果你希望腐竹能改你的插件文案,但又不想每次升级覆盖他的修改,可以:

1. 你的插件启动时调用 `i18n.register(...)` 注册一份默认文案。
2. 在 `lang/zh_CN.json`(主语言文件)中加上同名 key,**主文件优先级更高**(`I18n._loadFromFile` 在启动期先加载主文件,后续 register 调用会用扩展默认文案补;但主文件的内容已经写到 `_store[lang]` 里,register 是 Object.assign 进去,会覆盖主文件——所以这条策略要反过来:让主文件加载在 register **之后**,但这是内置加载顺序,扩展无能为力)。

实践上,**让腐竹直接编辑你的插件代码中的 register 块** 是最简单的;或者你单独提供一份 `<plugin>_lang.json` 文件,启动时读取并 register,腐竹只改这份文件即可。

## 内置文案分组

按 key 前缀:

| 前缀 | 用途 |
| --- | --- |
| `skyblock.*` | 全局公共文案(如前缀) |
| `guard.*` | 命令前置检查的提示 |
| `protection.*` | 保护拒绝时的提示 |
| `permission.*` | 权限节点的可读名 |
| `events.*` | 世界事件节点的可读名 |
| `cmd.*` | `/is` 子命令文案 |
| `admin.*` | `/isa` 管理 GUI 文案 |
| `warp.*` | 传送点文案 |
| `tpl.*` | `/tpl` 模板编辑器文案 |
| `perm.*` | `/is perm` 权限编辑文案 |
| `common.*` | 通用按钮(确认/取消) |

扩展插件 **强烈推荐用 `<插件名>.*` 前缀**,避免与内置文案冲突。

## 注意事项

- `tr` 失败不抛错,返回 key 本身。生产环境如果看到日志 / GUI 里出现 `"cmd.create.success"` 这样的原始 key,说明对应文案没在你的语言文件中。
- `register` **不会写盘**。重启后从 `lang/<lang>.json` 重新加载,你 register 的内容也要在扩展里再 register 一次(因为扩展会被 reload)。
- 切换语言不会触发任何事件,如果你的扩展需要响应语言变化,需要自己拦截 `setLang` 调用(目前没有标准机制)。

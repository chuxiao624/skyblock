# 多语言

本插件 内置中英文，所有 GUI 文案、消息提示、权限节点描述都走 i18n。

## 切换语言

编辑 `runtime/config/config.json`：

```json
{
    "lang": "zh_CN"
}
```

可选值：

| 值 | 文件 |
| --- | --- |
| `zh_CN` | `plugins/skyblock/lang/zh_CN.json` |
| `en_US` | `plugins/skyblock/lang/en_US.json` |

切换后**需要游戏内 /isa reload**才会生效

## 自定义文案

直接编辑 `lang/zh_CN.json`，覆盖你想修改的 key。例如把空岛前缀从 `[空岛]` 改成 `[嘻嘻哈哈]`：

```json
{
    "skyblock.prefix": "§b[嘻嘻哈哈]§r"
}
```

保存后重启 /isa reload 即可。

## 添加新语言

1. 复制 `lang/zh_CN.json`，保存为 `lang/ja_JP.json`（或其他 [语言代码](https://en.wikipedia.org/wiki/IETF_language_tag)）。
2. 把所有 value 翻译成目标语言。
3. 修改 `config.json` 的 `lang` 为 `"ja_JP"`。
4. 重启服务器。

## key 分组

`zh_CN.json` 的 key 大致按以下命名空间分组：

| 前缀 | 用途 |
| --- | --- |
| `skyblock.*` | 全局公共文案（如前缀） |
| `guard.*` | 命令前置检查的提示（没有岛屿 / 不是岛主 / 不在自己岛上） |
| `protection.*` | 保护拒绝时的提示 |
| `permission.*` | 权限节点的可读名（GUI 开关上显示的文字） |
| `events.*` | 世界事件节点的可读名 |
| `cmd.*` | `/is` 各子命令的提示文本 |
| `admin.*` | `/isa` 管理 GUI 的标题、按钮、提示 |
| `warp.*` | 传送点相关文案 |
| `tpl.*` | `/tpl` 模板编辑器文案 |
| `perm.*` | `/is perm` 权限编辑相关 |
| `common.*` | 通用按钮（确认 / 取消等） |

修改某个具体提示时按前缀找对应分组即可。

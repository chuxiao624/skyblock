# skyblock

> 基于 LSE 的基岩版空岛插件

把"空岛玩法的几大基础设施"打包成一个开箱即用的整体 岛屿生命周期、岛屿保护、传送点、模板系统、管理员工具、第三方扩展机制。

## 特性

- **完整空岛体系** —— 多人同岛 / 下界岛屿 / 自定义岛屿
- **精细权限控制** —— 43 个玩家行为权限 + 6 个世界事件,白名单可单独放权
- **木牌传送点** —— 放置告示牌即可创建传送点,跨岛自由传送
- **可视化模板编辑** —— 手持木斧选区,`/tpl` 一键导出主世界 + 下界配套模板
- **管理员代理 (sudo)** —— 以岛主身份临时进入他人岛屿协助维护
- **空间索引加速** —— O(1) 的坐标查询,告别卡顿
- **多语言支持** —— 内置中英文,可热注册自定义语言包
- **第三方扩展友好** —— 把 `.js` 文件丢进 `plugins/` 即自动加载

## 安装

### 1. 前置依赖

| 依赖 | 说明 |
| --- | --- |
| [BDS](https://www.minecraft.net/zh-hans/download/server/bedrock) | 基岩版官方服务端 |
| [LeviLamina](https://github.com/LiteLDev/LeviLamina) | BDS 加载器 |
| [legacy-script-engine-quickjs](https://github.com/LiteLDev/LegacyScriptEngine) | 脚本引擎(必需) |
| [skyblock-nether](https://www.minebbs.com/resources/skyblock-nether-bridge.16377/) | 下界作为玩家岛屿的前置(可选) |

### 2. 下载

去 [Releases](../../releases) 下载最新的 `skyblock-vX.X.X.zip`,解压后会得到一个 `skyblock/` 目录,把它整个放到 BDS 的 `plugins/` 下:

```
<BDS 根目录>/
└─ plugins/
   └─ skyblock/         ← 解压出来的目录
```

启动 BDS 即可。详细安装步骤见 [文档 · 安装](./docs/server/installation.md)。

## 文档

完整文档包含三部分:

- **腐竹指南** —— 部署、配置、管理、扩展玩法
- **玩家指南** —— 命令速查、传送点、权限管理、挑战
- **开发者指南** —— `globalThis.skyblock` API、事件、权限节点表、实战教程

文档源码在 [`docs/`](./docs) 目录,基于 [VitePress](https://vitepress.dev) 构建:

```bash
cd docs
npm install
npm run dev      # 本地预览
npm run build    # 构建静态站点
```

## 第三方扩展

仓库自带几个示例扩展(`plugins/` 目录):

| 插件 | 命令 | 说明 |
| --- | --- | --- |
| `challenges.js` | `/is challenge` | 多等级挑战任务系统 |
| `level.js` | `/is level *` | 基于方块价值的岛屿等级与排行榜 |
| `tips.js` | (自动) | 进出岛屿的标题 / ActionBar 提示 |
| `playerinfo.js` | (自动) | 缓存玩家名供管理员 GUI 搜索 |

写自己的扩展见 [开发者指南](./docs/developer/plugin-anatomy.md)。

## 主要命令

| 命令 | 用途 |
| --- | --- |
| `/is` | 玩家命令(创建岛屿、传送、邀请、权限...) |
| `/isa` | 管理员命令(代理 / 强删 / 扩缩 / 自定义岛屿...) |
| `/tpl` | 模板编辑器(木斧选区) |

完整命令表见 [功能特性 · 完整指令表](./docs/guide/features.md)。

## License

[MIT](./LICENSE)

## 致谢

- [LeviLamina](https://github.com/LiteLDev/LeviLamina) —— BDS 加载器
- [LegacyScriptEngine](https://github.com/LiteLDev/LegacyScriptEngine) —— 脚本引擎

# 项目介绍

**skyblock** 是一个基于 [LegacyScriptEngine](https://github.com/LiteLDev/LegacyScriptEngine)  的基岩版空岛插件，运行在 LeviLamina 之上。

把"空岛玩法的几大基础设施"打包成一个开箱即用的整体：岛屿生命周期、岛屿保护、传送点、模板系统、管理员工具、第三方扩展机制。

## 它适合谁

- **腐竹**：想快速搭一个稳定可控的空岛服。
- **玩家**：操作指南。
- **开发者**：想为自己的空岛服添加新玩法（任务、经济、排行榜……）。

## 核心特性

- **岛屿生命周期**：创建 / 解散 / 转让 / 扩缩 / 自定义岛屿。
- **岛屿保护**：50+ 权限节点 + 6 个世界事件节点，按维度独立配置全局策略。
- **传送点**：基于木牌的轻量传送系统，支持公开 / 私有切换。
- **模板编辑**：手持木斧选区，`/tpl` 一键导出 `.mcstructure` 主世界 + 下界模板对。
- **管理员工具**：`/isa` 全功能 GUI，涵盖各种操作、扩缩、强制转让、玩家管理、自定义岛屿……
- **管理员代理**：以岛主身份代理玩家的岛屿
- **多语言**：内置中英文，支持第三方扩展热注册自己的语言包。
- **第三方扩展机制**：把 `.js` 文件丢进 `plugins/` 配套事件总线、Store 共享、命令注册 API。

## 架构层次

```
core      基础设施（事件、配置、命令、定时器、I18n、Storage、SpatialGrid）
  │
  ▼
repos     数据访问（IslandRepo / PermissionRepo / WarpRepo / ...）
  │
  ▼
services  业务编排（IslandService / ProtectionService / AdminProxyService / ...）
  │
  ▼
api       对外接口（globalThis.skyblock.* 命名空间）
  │
  ▼
modules   内置功能模块（commands / protection / warp / admin / template-editor / nether / tracker）
  │
  ▼
plugins   第三方扩展（challenges.js / level.js / tips.js / menu.js / tpa.js / playerinfo.js）
```

第三方扩展只依赖 `globalThis.skyblock` 命名空间，所有内置功能都建立在 `core` 之上。

## 接下来

- 部署服务器 → [腐竹指南](/server/installation)
- 在服里玩 → [玩家指南](/player/getting-started)
- 给它写扩展 → [开发者指南](/developer/quickstart)

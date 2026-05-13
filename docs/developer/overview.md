# 架构总览

SkyBlock 采用 **6 层分层** 设计。每层只依赖比自己更底层的层，不允许反向引用。

```
┌──────────────────────────────────────────────────────┐
│ plugins/       第三方扩展(挂在 globalThis.skyblock)  │
└──────────────────────────────────────────────────────┘
                       ▲
┌──────────────────────────────────────────────────────┐
│ src/modules/   内置功能(命令、保护、传送、管理 GUI)  │
└──────────────────────────────────────────────────────┘
                       ▲
┌──────────────────────────────────────────────────────┐
│ src/api/       对外接口 → globalThis.skyblock.*      │
└──────────────────────────────────────────────────────┘
                       ▲
┌──────────────────────────────────────────────────────┐
│ src/services/  业务编排(IslandSvc / Protect / ...)   │
└──────────────────────────────────────────────────────┘
                       ▲
┌──────────────────────────────────────────────────────┐
│ src/repos/     数据访问(IslandRepo / PermissionRepo) │
└──────────────────────────────────────────────────────┘
                       ▲
┌──────────────────────────────────────────────────────┐
│ src/core/      基础设施(EventBus / Config / Command) │
└──────────────────────────────────────────────────────┘
```

`src/` 是内部代码,腐竹不应该手动修改。`plugins/` 才是第三方扩展挂载点。

## 各层职责

### core/ — 基础设施

| 文件 | 作用 |
| --- | --- |
| `EventBus.js` | 事件总线，`guard / check`(权限语义) + `on / emit`(广播语义) |
| `Config.js` | 全局配置管理(`runtime/config/config.json`) |
| `Command.js` | `/is` 子命令注册器,启动期统一 setup() |
| `Storage.js` | `JsonConfigFile` 的薄包装,带防抖 flush |
| `I18n.js` | 多语言,支持热注册 |
| `Logger.js` | 带 tag 与颜色码的日志器 |
| `Session.js` | TTL 自动过期的临时键值(邀请、解散确认) |
| `Timer.js` | 命名的 setInterval / setTimeout 管理器 |
| `Store.js` | 共享 KV + 函数注册(扩展间通信) |
| `Coord.js` | 螺旋坐标分配器 |
| `SpatialGrid.js` | 二维网格索引(O(1) 的坐标→岛屿查询) |
| `Bootstrap.js` | 启动期任务(同步模板、加载扩展) |
| `constants.js` | 全局常量(维度 id、信任等级、超时秒数等) |
| `paths.js` | 所有文件路径的单点维护 |

### repos/ — 数据访问

直接读写 `runtime/*.json` 的薄壳。每个 Repo 持有一个 `Storage` 实例,提供 `get / set / remove / list` 之类的纯数据操作,**不做任何业务校验**。

| 文件 | 数据文件 | 作用 |
| --- | --- | --- |
| `IslandRepo.js` | `islands.json` + `index.json` | 岛屿主数据 + xuid 反查索引 |
| `PermissionRepo.js` | `permissions.json` | 每个岛屿的权限配置 |
| `PermsConfigRepo.js` | `config/permissions.json` | 维度级全局权限 |
| `WarpRepo.js` | `warps.json` | 传送点 |
| `AdminProxyRepo.js` | `admin_proxy.json` | 管理员代理状态 |

### services/ — 业务编排

| 文件 | 作用 |
| --- | --- |
| `IslandService.js` | 岛屿生命周期(创建 / 删除 / 转让 / 扩缩 / 自定义岛屿) |
| `PermissionService.js` | 权限编辑(defaults / events / allowlist) |
| `ProtectionService.js` | 保护判定(优先级:OP→末地→下界→岛屿→全局) |
| `TrackerService.js` | 玩家位置轮询(`xuid → 当前所在岛 id`) |
| `AdminProxyService.js` | sudo 代理流程(enter / exit / restore) |

所有写操作都返回 `{ ok, code, ...payload? }`,失败时 `code` 是机读串(`no_island` / `already_member` / ...),便于上层国际化或重试。

### api/ — 对外接口

把 service 包装成可挂到 `globalThis.skyblock.*` 的薄壳。除了 `index.js` 装配,基本是一对一转发。

详见 [globalThis.skyblock](./globals)。

### modules/ — 内置功能

把多个 service 组合成"用户能看到的功能"。模块之间通过 `EventBus` 通讯,不直接相互 import。

| 模块 | 命令 / 功能 |
| --- | --- |
| `commands/` | `/is create / disband / spawn / setspawn / info / transfer / invite / kick / leave / perm` |
| `warp/` | `/is warp` + 木牌交互 |
| `admin/` | `/isa` 全套管理 GUI |
| `template-editor/` | `/tpl` 模板编辑器 |
| `protection/` | 把 LSE 事件转成 EventBus guard,执行权限检查 |
| `nether.js` | 监听 `island:created` 加载下界结构 |
| `tracker.js` | 接入 `mc.listen` 启动 Tracker 轮询 |

### plugins/ — 第三方扩展

放在 `plugins/skyblock/plugins/*.js`,服务器启动时被 `loadPlugins()` 自动 `require`。

只允许通过 `globalThis.skyblock.*` 访问内置能力,不直接 import 内部文件。

## 关键设计

### 事件总线两套语义

- `guard / check`:权限检查,任意 fn 返回 `true` 即放行(**白名单语义**)。无监听时默认放行。
- `on / emit`:广播通知,所有监听都会被调用,异常单独捕获,不返回值。

[详见 EventBus](./api-event)。

### 螺旋坐标分配

`Coord.next()` 用螺旋算法依次返回新岛屿坐标。状态持久化到 `coord.json`,服务器重启后从上次的状态继续。

**绝不能手动修改 `coord.json` 或 `config.island.{startX, startZ, range, gap}`**——会导致后续岛屿坐标与已有岛屿冲突。

### 空间网格索引

`SpatialGrid` 把世界 X/Z 平面按 `cellSize`(默认 = `island.gap`)切成网格。查"坐标 → 岛屿"时:

1. 算 `pos` 落在哪个格子。
2. 该格子内候选岛屿通常 0-1 个。
3. 对候选做精确 AABB 检测。

效果是 **O(1) 的查询**,在 `tracker` 每 500ms 全员位置查询时几乎零开销。

### 数据修改后自动 emit

`services/*` 在所有写操作完成后会 `Event.emit(...)` 通知监听者。这是第三方扩展获取实时状态变化的标准入口。

[详见事件清单](./events)。

## 启动顺序

见 [启动生命周期](./lifecycle)。

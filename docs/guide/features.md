# 功能特性

## 岛屿系统

- 岛屿创建。
- 岛屿坐标分配，无需手动规划 螺旋算法。
- 解散、转让、扩建、缩小。
- 自定义岛屿（管理员创建  可用作主城 / 公共区）。

## 岛屿保护

- 50+ 细粒度权限节点，覆盖：方块破坏 / 放置、实体交互、容器、工具、PvP、火焰蔓延、爆炸、耕地退化…
- 三套独立策略：主世界 / 下界 / 末地。
- 每个岛可独立配置 `defaults`（默认权限）和 `allowlist`（白名单玩家及其授权节点）。
- 岛外区域回退到全局 `permissions.json`。

详细列表见 [权限节点表](/developer/permission-nodes)。

## 传送点

- 通过放置 / 编辑木牌快速创建传送点。

## 成员系统

- 一个人太孤单 ? 让玩家合作起来。

## 模板系统

- `/tpl` 命令进入木斧选区模式，粒子边框可视化。
- 全GUI 模板编辑。

## 管理员工具

- `/isa` 全功能 GUI 主菜单：岛屿列表、玩家列表、自定义岛屿、sudo 代理、reload。
- 强制删除、强制转让、强制踢出、扩缩岛屿、重置玩家解散次数...

## 多语言

- 内置 `zh_CN`、`en_US`，可在 `config.json` 切换。
- 所有 GUI 文案、提示文本、权限节点描述都走 i18n。
- 第三方扩展可热注册自己的语言包。

## 第三方扩展

把 `.js` 文件丢进 `plugins/skyblock/plugins/`，服务器启动时自动 `require`

详见 [开发者指南](/developer/quickstart)。

## 内置扩展插件

| 插件 | 命令 | 作用 |
| --- | --- | --- |
| `challenges.js` | `/is challenge` | 多等级挑战任务系统，奖励物品 / NBT / 经验 / 命令 |
| `level.js` | `/is level calc / top / check / set` | 基于方块价值表计算岛屿等级和排行榜 |
| `tips.js` | （自动） | 进入 / 离开岛屿时显示标题和 ActionBar 提示 |
| `playerinfo.js` | （自动） | 缓存玩家名以供管理员 GUI 搜索 |

## 完整指令表

### 玩家命令 `/is`

| 命令 | 说明 |
| --- | --- |
| `/is help` | 显示帮助 |
| `/is create` | 创建岛屿（选模板 GUI） |
| `/is disband` | 解散岛屿（30 秒内再输一次确认） |
| `/is info` | 查看当前岛屿信息 |
| `/is spawn` | 传送到自己的岛屿出生点 |
| `/is setspawn` | 把当前位置设为自己的岛屿出生点（仅主世界 + 自己岛上） |
| `/is transfer` | 转让岛主（GUI 选成员） |
| `/is invite <玩家>` | 邀请玩家加入岛屿 |
| `/is invite accept` | 接受邀请 |
| `/is invite refuse` | 拒绝邀请 |
| `/is kick <玩家>` | 踢出某个成员（仅岛主） |
| `/is leave` | 离开当前岛屿（非岛主） |
| `/is perm edit` | 编辑岛屿默认权限（GUI） |
| `/is perm allowlist` | 管理白名单玩家（GUI） |
| `/is perm allowlist <玩家>` | 直接编辑指定玩家的白名单 |
| `/is perm add <玩家> <节点>` | 命令式：给玩家添加权限节点 |
| `/is perm remove <玩家> <节点>` | 命令式：移除玩家的权限节点 |
| `/is warp list` | 列出自己岛屿的所有传送点 |
| `/is warp public` | 浏览所有公开传送点 |
| `/is warp toggle` | 切换某个传送点的公开 / 私有 |

### 玩家扩展命令(内置扩展插件提供)

| 命令 | 说明 | 来源 |
| --- | --- | --- |
| `/is challenge` | 打开挑战 GUI | `challenges.js` |
| `/is level calc` | 计算岛屿等级（5 分钟冷却） | `level.js` |
| `/is level top` | 岛屿等级排行榜 | `level.js` |
| `/is level check` | 查看手持方块的价值 | `level.js` |
| `/is level set <分数>` | 设置手持方块价值（仅 OP） | `level.js` |

### 管理员命令 `/isa`(需 SkyBlock 管理员)

| 命令 | 说明 |
| --- | --- |
| `/isa` | 打开管理员主菜单 GUI |
| `/isa here` | 打开你脚下所在岛屿的详情 GUI |
| `/isa sudo` | 代理进入脚下所在岛屿 |
| `/isa sudo <玩家>` | 代理进入指定玩家所在的岛屿 |
| `/isa sudo exit` | 退出代理状态 |
| `/isa expand <玩家> <格数>` | 把该玩家岛屿四个方向各扩展 N 格 |
| `/isa shrink <玩家> <格数>` | 把该玩家岛屿四个方向各缩小 N 格 |
| `/isa create` | 创建自定义岛屿（无 owner，公共区/主城用） |
| `/isa admin add <玩家>` | 添加 SkyBlock 管理员（OP 执行） |
| `/isa admin del <玩家>` | 移除 SkyBlock 管理员（OP 执行） |
| `/isa admin list` | 列出所有 SkyBlock 管理员 |
| `/isa reload` | 重载 skyblock 插件 |

### 模板编辑器 `/tpl`

| 命令 | 说明 |
| --- | --- |
| `/tpl` | 打开模板编辑器 GUI（木斧选区 + 粒子可视化） |

### 玩家操作

| 触发 | 效果 |
| --- | --- |
| 在自己岛上放木牌，第 1 行 `[传送点]`，第 2 行写名字，**蹲下右键** | 创建一个传送点 |
| **蹲下右键** 一个已激活的传送点木牌 | 编辑传送点名字 |
| 破坏传送点木牌 | 删除该传送点 |
| 岛主 **手持指南针 + 蹲下 + 攻击玩家** | 打开该玩家的权限白名单 GUI |


# 完整指令表

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
| 在自己岛上放木牌，第 1 行 `[传送点]`，第 2 行写名字，**右键** | 创建一个传送点 |
| **蹲下右键** 一个已激活的传送点木牌 | 编辑传送点名字 |
| 破坏传送点木牌 | 删除该传送点 |
| 岛主 **手持指南针 + 蹲下 + 攻击玩家** | 打开该玩家的权限白名单 GUI |

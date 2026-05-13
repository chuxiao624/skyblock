# 常量 / 路径

## CONST

`core/constants.js` 中维护的全局常量。在扩展里推荐 import,而不是硬编码数字。

::: warning 第三方扩展不能直接 import
`CONST` 没挂到 `globalThis.skyblock` 上。第三方扩展如果需要这些值,目前只能:

- 自己定义同名常量
- 或者用魔术数字直接写(不推荐)

未来如有需要,可以考虑挂到 `skyblock.CONST`。
:::

### 时间(秒)

| 名 | 值 | 用途 |
| --- | --- | --- |
| `INVITE_TIMEOUT_SEC` | 30 | 邀请过期时间 |
| `DISBAND_CONFIRM_SEC` | 30 | 解散二次确认窗口 |

### 时间(毫秒)

| 名 | 值 | 用途 |
| --- | --- | --- |
| `CHUNK_LOAD_POLL_MS` | 100 | 创岛后区块加载检测周期 |
| `TRACKER_INTERVAL_MS` | 500 | 玩家位置轮询间隔 |
| `STORAGE_FLUSH_MS` | 500 | 存储防抖刷盘间隔 |

### 长度限制

| 名 | 值 | 用途 |
| --- | --- | --- |
| `NAME_MAX_LEN` | 16 | warp 名称最大长度 |
| `ID_LEN` | 16 | 岛屿 id 长度 |

### 维度 ID

| 名 | 值 | 维度 |
| --- | --- | --- |
| `DIM_OVERWORLD` | 0 | 主世界 |
| `DIM_NETHER` | 1 | 下界 |
| `DIM_END` | 2 | 末地 |

### 信任等级

| 名 | 值 | 角色 |
| --- | --- | --- |
| `TRUST_OWNER` | 1 | 岛主 |
| `TRUST_MEMBER` | 2 | 普通成员 |

写入岛屿数据的 `members[xuid].trustLevel` 字段。判定时用 `member.trustLevel === CONST.TRUST_OWNER` 等。

### 文本提示位置

`player.tell(msg, mode)` 的 `mode` 参数:

| 名 | 值 | 显示位置 |
| --- | --- | --- |
| `TELL_CHAT` | 0 | 普通聊天框 |
| `TELL_ACTIONBAR` | 4 | 屏幕下方的 ActionBar |

## PATHS

`core/paths.js` 中维护的所有相对路径。

### 根目录

```
ROOT = "plugins/skyblock"
```

### 配置文件

| 名 | 路径 |
| --- | --- |
| `CONFIG` | `plugins/skyblock/runtime/config/config.json` |
| `PERMS_CONFIG` | `plugins/skyblock/runtime/config/permissions.json` |

### 运行时数据

| 名 | 路径 | 内容 |
| --- | --- | --- |
| `ISLANDS` | `runtime/islands.json` | 所有岛屿数据 |
| `INDEX` | `runtime/index.json` | xuid → islandId 反查 |
| `COORD` | `runtime/coord.json` | 螺旋坐标分配器状态 |
| `WARPS` | `runtime/warps.json` | 所有传送点 |
| `PERMS` | `runtime/permissions.json` | 每个岛屿的权限配置 |
| `ADMIN_PROXY` | `runtime/admin_proxy.json` | 管理员代理状态 |

### 资源目录

| 名 | 路径 |
| --- | --- |
| `LANG_DIR` | `plugins/skyblock/lang` |
| `TEMPLATES_DIR` | `plugins/skyblock/templates` |
| `PLUGINS_DIR` | `plugins/skyblock/plugins` |

### BDS 内部目录

| 名 | 路径 |
| --- | --- |
| `BDS_STRUCTURES` | `behavior_packs/vanilla/structures` |

启动时模板会从 `TEMPLATES_DIR` 同步到 `BDS_STRUCTURES`,让 `structure load` 能找到。

## 在扩展里硬编码路径的取舍

如果你的扩展也要存数据,**用自己专属的子目录**(参考 `plugins/level/`、`plugins/challenges/data/`),不要往 `runtime/` 里塞东西——那是核心数据目录,版本升级时可能被自动迁移。

推荐结构:

```
plugins/skyblock/plugins/
├─ myplugin.js
└─ myplugin/
   └─ data/
      ├─ config.json
      └─ player.json
```

# 数据文件结构

`runtime/` 下所有 JSON 文件的字段说明。**不要手动改这些文件**(除非服务器停了),用 API 操作。

## runtime/islands.json

```json
{
    "data": {
        "<islandId>": {
            "name":     "chuxiao",
            "nickname": "",
            "owner":    "<xuid>",
            "kind":     "normal",
            "range": {
                "min": [-32, -32],
                "max": [ 31,  31]
            },
            "members": {
                "<xuid>": {
                    "trustLevel": 1,
                    "spawn": [0, 64, 0, 0]
                }
            }
        },
        ...
    },
    "deletes": {
        "<xuid>": 2,
        ...
    }
}
```

| 字段 | 说明 |
| --- | --- |
| `data` | 所有岛屿,key 是 islandId(16 字符随机串) |
| `data[id].name` | 岛屿名(默认 = 岛主玩家名,转让后会改) |
| `data[id].nickname` | 玩家自定义昵称(暂未启用) |
| `data[id].owner` | 岛主 xuid;**自定义岛屿为 `null`** |
| `data[id].kind` | `"normal"` 或 `"custom"` |
| `data[id].range` | 岛屿在 X/Z 平面上的 AABB |
| `data[id].members[xuid].trustLevel` | `1`=岛主 `2`=成员 |
| `data[id].members[xuid].spawn` | `[x, y, z, dimid]` 个人出生点 |
| `deletes[xuid]` | 该玩家累计解散过的岛屿次数 |

自定义岛屿额外字段:

```json
{
    "owner": null,
    "kind":  "custom",
    "spawn": [0, 64, 0, 0]    // 顶层 spawn,代替 members[owner].spawn
}
```

## runtime/index.json

```json
{
    "data": {
        "<xuid>": "<islandId>",
        ...
    }
}
```

`xuid → islandId` 的反查表。每个 xuid 只能指向一个 islandId(除非他在多个岛之间转移成员身份,但同一时刻只有一个)。

::: tip 反查 islandId
通过 `IslandRepo.getIndex(xuid)` 或 `skyblock.island.xuid2islandId(xuid)` 读这张表。
:::

## runtime/coord.json

```json
{
    "data": {
        "offsetX":     0,
        "offsetZ":     0,
        "direction":   "right",
        "moves":       0,
        "totalMoves":  1,
        "loops":       0,
        "steps":       0,
        "isInit":      false
    }
}
```

`Coord` 螺旋分配器的当前状态。下一个岛屿会基于这些值计算坐标。

::: danger 不要手改
螺旋算法依赖整个状态序列。手改任何字段都会导致后续岛屿与已有岛屿坐标冲突。

如果一定要重置(比如开新服),**先备份再清空,并 `_storage.init` 会重建默认状态**。
:::

## runtime/warps.json

```json
{
    "data": {
        "<islandId>": {
            "<warpName>": {
                "sign_pos": "100_64_200_0",
                "public":   false
            },
            ...
        },
        ...
    }
}
```

每岛一个对象,key 是 warp 名(玩家在木牌第 2 行填的)。

- `sign_pos`:`"<x>_<y>_<z>_<dimid>"` 字符串(用于精确反查木牌位置)。
- `public`:是否公开。

## runtime/permissions.json

```json
{
    "data": {
        "<islandId>": {
            "defaults": {
                "destroy_block": false,
                "place_block":   false,
                ...
            },
            "events": {
                "onEntityExplode":     false,
                ...
            },
            "allowlist": {
                "<xuid>": ["use_container", "use_door"],
                ...
            },
            "roles": {}
        },
        ...
    }
}
```

`defaults` 和 `events` 完整列表见 [权限节点表](./permission-nodes)。

`roles` 字段目前**保留**,暂未启用。`_migrate` 会保留你的字段但不强对齐。

启动时 `_migrate` 会:
- 给 `defaults` 和 `events` 补齐模板中存在但你缺失的字段(默认值 false)
- 删除模板中已不存在的字段
- 保留 `allowlist` 和 `roles` 原样不动

## runtime/admin_proxy.json

```json
{
    "data": {
        "<adminXuid>": {
            "oldIsland": "<islandId | null>",
            "proxy":     "<islandId>"
        },
        ...
    }
}
```

每个正在 sudo 中的管理员一条记录。

- `oldIsland`:进入代理之前该管理员的 index 指向的岛(可能为 null)。
- `proxy`:当前被代理的岛屿 id。

启动期 `AdminProxySvc.restore()` 会用这份数据修复内存中的 members / index。

## runtime/config/config.json

见 [全局配置](/server/configuration)。

## runtime/config/permissions.json

见 [全局保护策略](/server/permissions-config)。

## 手改的安全规则

如果你必须手动改 JSON:

1. **停服**(不仅是 `/isa reload`,而是关 BDS)。
2. **先备份**整个 `runtime/` 目录。
3. **保证 JSON 合法**(用 lint 工具校验)。
4. **不要改 coord.json 的 isInit / totalMoves / loops** 等。
5. **不要让 index.json 和 islands.json 不一致**(指向不存在的 islandId,或岛存在但没在 index 中)。
6. 改完启服,观察日志看 `_migrate` / `restore` 有没有报错。

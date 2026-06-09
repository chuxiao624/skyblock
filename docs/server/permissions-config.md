# 全局保护策略

文件位置：

```
plugins/skyblock/config/permissions.json
```

这份配置作用于 **岛屿之外** 的区域：

- 玩家在无主之地（任何岛屿之外）的行为
- 下界（当 `nether_as_island` 为 `false` 时整个下界）
- 末地（**永远**）

## 文件结构

```json
{
    "overworld": {
        "defaults": { ... },  // 主世界 玩家岛屿外的默认权限
        "events":   { ... }
    },
    "nether": {
        "defaults": { ... },  // 下界 玩家岛屿外的默认权限
        "events":   { ... }
    },
    "end": {
        "defaults": { ... },  // 末地 玩家岛屿外的默认权限
        "events":   { ... }
    }
}
```

三个维度各自独立配置，互不影响。每个维度下：

- `defaults`：玩家行为权限节点（破坏、放置、交互……）
- `events`：世界事件节点（爆炸、火焰蔓延、耕地退化等）

完整节点列表见 [权限节点表](/developer/permission-nodes)。

## 举例子

::: code-group

```json [主世界之外挖方块]
{
    "overworld": {
        "defaults": {
            "destroy_block": true, // 直接打开破坏方块权限即可
            "place_block": false,
            ...
        },
        "events": {
            ...
        }
    }
}
```

```json [下界放/挖方块]
{
    "nether": {
        "defaults": {
            "destroy_block": true,
            "place_block": true,
           ...
        },
        "events": {
          ...
        }
    }
}
```

:::

## 优先级

岛屿保护的判定顺序([`ProtectionService`](/developer/api#skyblock-protect)):

```
1. 玩家是岛屿管理员                 → 放行
2. 末地                            → 走全局 end
3. 下界 且 nether_as_island=false  → 走全局 nether
4. 坐标命中某个岛屿:
     a. 玩家是该岛成员              → 放行
     b. 玩家在该岛白名单            → 放行
     c. 否则用该岛 defaults
5. 坐标不在任何岛屿                 → 走全局 overworld
```

::: tip 修改后需要重启
**修改文件后需要重启服务器或 `/isa reload` 才会生效**。
:::

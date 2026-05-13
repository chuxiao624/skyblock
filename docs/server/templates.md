# 模板概念

模板是玩家创建岛屿时选择的"初始结构"。一份完整的模板由两部分组成：

1. **`.mcstructure` 文件**：实际的方块数据，放在 `plugins/skyblock/templates/`。
2. **`config.json` 中的 `templates` 数组条目**：描述该模板的元信息（名称、出生点偏移等）。

启动时插件会把 `templates/` 下的所有 `.mcstructure` 文件 **自动同步** 到 BDS 的 `behavior_packs/vanilla/structures/` 目录，再通过 `structure load` 指令粘贴到岛屿坐标。

## 元信息字段

```json
{
    "name": "经典空岛",
    "file": "sky1",
    "spawnX": 9,
    "spawnY": 63,
    "spawnZ": 9,
    "pasteOffset": [0, 5, 2],
    "description": "经典空岛,原汁原味",
    "nether_template": {
        "file": "sky1_nether",
        "spawnX": 9,
        "spawnY": 33,
        "spawnZ": 9,
        "pasteOffset": [0, 5, 2]
    }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | GUI 中显示的名称 |
| `description` | `string` | GUI 中显示的描述 |
| `file` | `string` | `.mcstructure` 文件名（不含扩展名） |
| `spawnX` `spawnY` `spawnZ` | `int` | 模板的尺寸，用来计算粘贴起点 |
| `pasteOffset` | `[int, int, int]` | 模板内 **出生点** 相对模板原点的偏移 |
| `nether_template` | `Object?` | 可选，对应的下界模板（结构同主模板） |

### pasteOffset 是什么

`pasteOffset` 告诉插件：**"从模板的左下角出发，向 +x +y +z 走多少格，是玩家应该被传送到的出生点"**。

- 主模板的 `[x, y, z]` 偏移会用来：
  - 计算 `structure load` 的粘贴坐标，让出生点恰好落在岛屿中心；
  - 计算玩家的初始 `respawn` 位置。
- 下界模板的 `pasteOffset` 用于下界出生点（在 [下界岛屿](/player/nether) 中说明）。

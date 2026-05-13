# 岛屿挑战配置

让玩家完成任务换奖励的扩展。本页教你怎么添加 / 修改挑战。

::: tip 这是一个 JSON 文件

强烈推荐用 [VS Code](https://code.visualstudio.com/) 打开 JSON 文件
:::

## 文件在哪

```
plugins/skyblock/plugins/challenges/data/data.json
```

打开它,你会看到三大块:

```json
{
    "levels":       [ ... ],   // 等级:新手 / 基础 / 简单 / 普通 / 困难
    "challenges":   { ... },   // 所有的挑战
    "nbtTemplates": { ... }    // 特殊物品奖励(可不动)
}
```

```json
    "levels": [
        {
            "name": "新手", // 等级名
            "icon": "textures/items/apple", // 在GUI里的按钮图片
            "unlock": null  // 解锁条件
        },
        {
            "name": "基础",
            "icon": "textures/items/wood_pickaxe",
            "unlock": {
                "from": "新手",  // 需要完成 名字为 "新手" 的 5个任务才会解锁
                "count": 5
            }
        },
        {
            "name": "简单",
            "icon": "textures/items/iron_ingot",
            "unlock": {
                "from": "基础",
                "count": 6
            }
        }
        
    ],
```

## 添加一个新挑战

下面是一个粒子 , 玩家背包要有32个石头 奖励是一个钻石

```json
"my_first_challenge": {
    "name": "上交 32 个石头", // 任务名字
    "description": "去采集 32 个石头并提交", // 描述
    "rewardText": "1 个钻石", // 奖励描述
    "level": "新手", // 任务等级
    "maxTimes": 1, // 最大可完成次数
    "check": {  // 
        "type": "inventory", //  任务类型  背包拥有物品
        "items": [
            { "id": "minecraft:stone", "count": 32 } // 需要拥有 32 个石头 
        ]
    },
    "rewards": [
        { 
            "id": "minecraft:diamond", // 奖励物品的 type
            "type": "item",  // 奖励类型 此处为 item 即奖励物品
            "count": 1 // 奖励数量
         } //
    ]
}
```

保存后,重启服务器

::: warning 字段说明

- `"level"`:必须是 `levels` 数组里出现过的名字。
- `"maxTimes"`:`1` 表示一次性,`100` 表示可重复 100 次。
:::

## 挑战类型表

挑战写在 `check` 字段里,目前支持 **4 种**:

| 类型 | 名字 | 玩家要做什么 | 是否消耗 |
| --- | --- | --- | --- |
| `inventory` | 收集物品 | 背包里凑够指定数量的物品 | 提交时 **全部扣除** |
| `block` | 放置方块 | 在身边一定范围内放好指定方块 | 不消耗 |
| `entity` | 拥有实体 | 在身边一定范围内聚集 | 不消耗 |
| `level` | 岛屿等级 | 岛屿等级达到指定值 | 不消耗 |

下面分别给出每种类型的写法。

### 收集物品 `inventory`

```json
"check": {
    "type": "inventory",
    "items": [
        { "id": "minecraft:iron_ingot", "count": 16 },
        { "id": "minecraft:coal",       "count": 32 }
    ]
}
```

提交时背包要凑够所有物品,**全部会被扣除**。适合"上交材料换奖励"。

### 放置方块 `block`

```json
"check": {
    "type": "block",
    "radius": 3,
    "blocks": [ "minecraft:crafting_table", "minecraft:furnace" ]
}
```

身边 `radius` 格内必须 **同时** 出现这些方块。`radius` 不填默认 3。

### 拥有实体 `entity`

```json
"check": {
    "type": "entity",
    "radius": 10,
    "entities": [
        { "id": "minecraft:villager", "count": 3 }
    ]
}
```

身边 `radius` 格内有指定数量的实体。适合"聚集 3 个村民"、"召唤 1 个铁傀儡"。

### 岛屿等级 `level`

```json
"check": { "type": "level", "level": 50 }
```

岛屿等级达到指定值。**玩家需要先 `/is level calc` 算过等级**,不然永远验证不过。

## 奖励类型表

奖励写在 `rewards` 数组里,目前支持 **7 种**,**可以同时给多种**:

| 类型 | 名字 | 给玩家什么 | 备注 |
| --- | --- | --- | --- |
| `item` | 普通物品 | 指定 ID 的物品 N 个 | 最常用 |
| `nbt` | NBT 物品 | 附魔 / 命名 / 特殊状态的物品 | 需要先抓 SNBT,见下文 |
| `exp` | 经验点 | 增加经验值 | - |
| `level` | 经验等级 | 增加经验等级 | - |
| `money` | 金钱 | LLMoney 货币 +N | 需经济插件 |
| `score` | 计分板 | 指定计分板 +N | - |
| `command` | 执行命令 | 以服务器身份后台跑一条命令 | `{player}` 自动替换玩家名 |

每种类型的最小写法:

```json
{ "type": "item",    "id": "minecraft:diamond",     "count": 5 }
{ "type": "nbt",     "template": "我的传说之剑",     "count": 1 }
{ "type": "exp",     "amount": 100 }
{ "type": "level",   "amount": 5 }
{ "type": "money",   "amount": 500 }
{ "type": "score",   "name": "kills",                "amount": 1 }
{ "type": "command", "command": "tag {player} add vip" }
```

一组多奖励的写法:

```json
"rewards": [
    { "type": "item",    "id": "minecraft:diamond", "count": 3 },
    { "type": "exp",     "amount": 50 },
    { "type": "command", "command": "tag {player} add vip" }
]
```

## 等级 (`levels`)

每个挑战必须属于一个等级。默认有 5 级:新手 → 基础 → 简单 → 普通 → 困难,每级需要完成上一级的 5-6 个挑战才会解锁。

想 **新增** 或 **改名** 一个等级,改 `levels` 数组:

```json
{
    "name": "传说",
    "icon": "textures/items/nether_star",
    "unlock": { "from": "困难", "count": 6 }
}
```

| 字段 | 说明 |
| --- | --- |
| `name` | 等级名(挑战的 `"level"` 字段引用它) |
| `icon` | GUI 按钮上的图标(参考 minecraft 资源包路径) |
| `unlock.from` | 需要先完成哪个等级 |
| `unlock.count` | 那个等级需要完成多少个挑战 |
| `unlock: null` | 这是入门级,无前置 |

## 给"特殊物品"做奖励 (NBT)

如果你想奖励 **附魔过的剑、改了名字的物品、特殊变种的树苗**,普通 `item` 类型做不到,需要用 `nbt`。

### 步骤一:在游戏里抓物品 NBT

用 LSE 控制台运行一次这个小脚本(或者让懂代码的朋友帮忙):

```js
mc.listen("onUseItem", (player, item) => {
    logger.info(item.getNbt().toSNBT());
});
```

把你想做奖励的物品拿在手里右键,**控制台会打印一长串字符**。

### 步骤二:存到 `nbtTemplates`

把那串字符当字符串值存进去,起个好记的名字:

```json
"nbtTemplates": {
    "我的传说之剑": "{...刚才控制台打印的那一长串...}"
}
```

### 步骤三:在奖励里引用

```json
{ "type": "nbt", "template": "我的传说之剑", "count": 1 }
```

## 修改后怎么生效

保存 `data.json`,然后在游戏内:

```
/isa reload
```

立刻生效,不用重启服务器。

::: warning 注意事项

- **不要改已发布挑战的 ID**,会让玩家的"已完成"状态丢失。一般只增不改、不删。
- **不要手动改 `player.json`**,那是玩家完成进度,插件自己维护。
- 改完保存前先用 [JSON 校验器](https://jsonlint.com) 检查一下语法,逗号 / 引号缺失最常见。
:::

## 一份完整的小例子

可以直接复制覆盖整个 `data.json` 用:

```json
{
    "levels": [
        { "name": "新手", "icon": "textures/items/apple", "unlock": null },
        { "name": "进阶", "icon": "textures/items/iron_ingot",
          "unlock": { "from": "新手", "count": 2 } }
    ],
    "challenges": {
        "place_chest": {
            "name": "存储物资",
            "description": "在你的岛屿放置一个箱子",
            "rewardText": "3 个泥土",
            "level": "新手",
            "maxTimes": 1,
            "check":   { "type": "block", "blocks": [ "minecraft:chest" ] },
            "rewards": [ { "type": "item", "id": "minecraft:dirt", "count": 3 } ]
        },
        "iron_age": {
            "name": "铁器时代",
            "description": "上交 16 个铁锭",
            "rewardText": "500 金币 + VIP 标签",
            "level": "进阶",
            "maxTimes": 100,
            "check": {
                "type": "inventory",
                "items": [ { "id": "minecraft:iron_ingot", "count": 16 } ]
            },
            "rewards": [
                { "type": "money", "amount": 500 },
                { "type": "command", "command": "tag {player} add vip" }
            ]
        }
    },
    "nbtTemplates": {}
}
```

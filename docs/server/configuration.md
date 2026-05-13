# 全局配置

全局配置文件位于：

```
plugins/skyblock/runtime/config/config.json
```

## 完整示例

```json
{
    "admins": [],  // 岛屿管理员列表 /isa admin add xxx 进行添加
    "lang": "zh_CN",  // 语言
    "island": {  
        "startX": 0, // 第一个岛屿的起始坐标 X
        "startZ": 0,  // 第一个岛屿的起始坐标 Z
        "range": 64,  // 玩家的岛屿大小 建议奇数(两边一样宽)
        "gap": 1000   // 玩家岛屿之间的间隔 建议1000 以上
    },
    "templates": [  // 岛屿模板
        {
            "name": "经典空岛", // 玩家创建岛屿时候会显示的名字
            "file": "sky1", // 对应的templates里面的 sky1.mcstructure 
            "spawnX": 9, 
            "spawnY": 63,
            "spawnZ": 9,
            "pasteOffset": [0, 5, 2],  // 偏移值 , 可以使用/tpl 快捷设置
            "description": "经典空岛,原汁原味", // 玩家创建岛屿时候会显示的描述
            "nether_template": { // 该模板绑定的下界模板
                "file": "sky1",
                "spawnX": 9,
                "spawnY": 63,
                "spawnZ": 9,
                "pasteOffset": [0, 5, 2]
            }
        }
    ],
    "respawn": [0, 64, 0, 0], // 玩家 删除岛屿后 会被传送至此 , 可以理解为主城
    "reset_limit": 3, // 玩家重置岛屿的次数限制
    "member_limit": 3, // 岛屿最大成员
    "nether_as_island": true, // 使下界也作为玩家的岛屿(需要安装前置)
}
```
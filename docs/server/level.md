# 岛屿等级配置

`level.js` 扩展为玩家提供 **岛屿等级与排行榜**：扫描岛屿范围内的所有方块，按 `block_score.json` 中的方块价值累加。

玩家侧的使用见 [玩家指南 - 岛屿等级](/player/level)。

::: warning 计算等级时 需要遍历玩家的岛屿 可能会造成卡顿 **整个扫描可能耗时几秒到几十秒**（取决于岛屿大小）
插件使用 分帧设计进行优化  我本地测试(测试配置: i7-12700 + 32G 内存) 玩家岛屿 300*300 计算等级时候 TPS 几乎无变化 
:::


## 文件位置

```
plugins/skyblock/plugins/
├─ level.js                      ← 扩展代码
└─ level/
   ├─ block_score.json           ← 方块价值表
   └─ config.json                ← 排行榜数据
```

## block_score.json

未在表中的方块 **不计分**  所以你可以只给"建造材料"设置价值 避免玩家刷等级。

### 修改价值表

::: code-group

```bash [游戏内（推荐）]

#  手持要设值的方块
/is level set 50
```

```bash [手动改文件]
编辑 plugins/skyblock/plugins/level/block_score.json
```

:::

## 等级公式

```
等级 = ⌊总分 / 100⌋
```

固定按 100 一档。如果你希望调整，需要修改 `level.js` 中的：

```js
let level = Math.floor(totalScore / 100);
```

## 给其他扩展使用

`level.js` 注册了一个 `Store` 函数：

```js
skyblock.Store.register("islandLevel:get", (islandId) => ranking[islandId] || 0, true);
```

其他扩展可以这样查岛屿等级：

```js
const lv = skyblock.Store.call("islandLevel:get", player.islandId) ?? 0;
```

`challenges.js` 的 `level` 类型检查器就是用的这个：

```json
{ "type": "level", "level": 50 }
```

## 调整冷却时间

`level.js` 顶部有：

```js
const CD = 1000 * 60 * 5; // 5分钟冷却
```

## 关闭等级扩展

如果你不需要等级功能，直接删除 `plugins/skyblock/plugins/level.js`（注意是 `level.js` 文件本身，**不是** `level/` 目录）。`/is level` 命令也会随之消失。

但注意：如果 `challenges.js` 中有 `type: "level"` 的挑战，它们会因为 `islandLevel:get` 未注册而永远无法完成。

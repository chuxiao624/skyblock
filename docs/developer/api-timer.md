# skyblock.Timer

命名的 `setInterval` / `setTimeout` 管理器。同名定时器会被自动 stop 旧的、start 新的,避免重复 / 遗漏。

## API

### `start(key, fn, intervalMs)`

启动一个命名的 `setInterval`。如果同 key 已存在的 interval,先 stop 旧的再 start 新的。

```js
skyblock.Timer.start("particle:" + player.xuid, () => {
    drawParticles(player);
}, 1000);  // 每秒一次
```

### `stop(key)`

停止某个 interval。无副作用,key 不存在也不报错。

```js
skyblock.Timer.stop("particle:" + player.xuid);
```

### `delay(key, fn, ms)`

启动一个命名的 `setTimeout`。如果同 key 已存在的 timeout,先 cancel 旧的再 delay 新的。

```js
skyblock.Timer.delay("warmup:" + player.xuid, () => {
    player.sendMsg("准备好了!");
}, 3000);
```

### `cancel(key)`

取消某个 timeout。

```js
skyblock.Timer.cancel("warmup:" + player.xuid);
```

## 实战模式

### 等待区块加载后做事

`modules/commands/island.js` 创岛后的标准 pattern:

```js
const key = `create:${player.xuid}`;
skyblock.Timer.start(key, () => {
    if (mc.getBlock(spawnPos) == null) return;  // 区块还没加载
    mc.runcmdEx(`structure load ${file} ...`);
    skyblock.Timer.stop(key);                   // 完成后自动停
}, 100);
```

每 100ms 检查一次,直到区块加载完成。

### 粒子边框可视化

`modules/template-editor/index.js` 中:

```js
function refreshParticles(xuid) {
    const sess = sessions.get(xuid);
    if (!sess?.pos1 || !sess?.pos2) {
        skyblock.Timer.stop(`tpl:${xuid}`);    // 状态不完整,停掉
        return;
    }
    skyblock.Timer.start(`tpl:${xuid}`, () => drawBorder(sess), 1000);
}
```

只要 `pos1/pos2` 都有,每秒画一遍边框;没全的时候停掉。

### 玩家退出时清理

LSE 的 `onLeft` 触发时手动清理:

```js
mc.listen("onLeft", (player) => {
    skyblock.Timer.stop("particle:" + player.xuid);
    skyblock.Timer.stop("warmup:" + player.xuid);
});
```

## 命名约定

key 建议格式:`<功能>:<标识>`,例如:

- `create:<xuid>` —— 玩家创岛后的区块等待
- `tpl:<xuid>` —— 模板编辑器粒子任务
- `cooldown:<xuid>` —— 玩家冷却计时

确保 key 在你扩展内唯一(扩展间也建议加前缀避免冲突,如 `economy:cooldown:<xuid>`)。

## 与 LSE setInterval / setTimeout 的区别

| | 原生 `setInterval` | `skyblock.Timer.start` |
| --- | --- | --- |
| 重复调用 | 创建多个独立 timer | 同名自动 stop 旧的 |
| 取消方式 | 需要保存返回的 id | 用名字 stop |
| 命名空间 | 全局 | 全局(自己管命名约定) |
| 异常处理 | 同 | 同(都不会自动捕获,需自己 try/catch) |

如果你只是一次性写一个匿名 setInterval,用原生 API 也没问题。`Timer` 的价值在 **同一逻辑实体的反复触发场景**(同一个玩家多次创岛、多次进出编辑模式等)。

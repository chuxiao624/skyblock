# skyblock.Session

TTL 自动过期的命名空间键值存储。用于邀请确认、解散确认这类"短期有效的会话状态"。

## 设计

```
namespace -> Map<key, { value, timer }>
```

每个条目自带一个 setTimeout,过期后自动从 Map 移除。

## API

### `set(namespace, key, value, ttlSec)`

写入一个条目,`ttlSec` 秒后自动清除。如果同 key 已存在,先清除旧定时器再覆盖。

```js
skyblock.Session.set("invite", targetXuid, ownerXuid, 30);
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `namespace` | `string` | 用于隔离不同业务,例如 `"invite"` / `"disband"` |
| `key` | `string` | 通常是 xuid |
| `value` | `any` | 任意值 |
| `ttlSec` | `int` | 过期秒数 |

### `get(namespace, key)`

读取。不存在返回 `undefined`。

```js
const inviterXuid = skyblock.Session.get("invite", player.xuid);
```

### `has(namespace, key)`

存在性判断,返回 `boolean`。

```js
if (skyblock.Session.has("invite", player.xuid)) {
    // 有未响应的邀请
}
```

### `del(namespace, key)`

主动删除,会清除对应的过期定时器。

```js
skyblock.Session.del("invite", player.xuid);
```

### `clearNamespace(namespace)`

清空整个命名空间。

```js
skyblock.Session.clearNamespace("invite");
```

## 内置使用场景

### 邀请确认

`modules/commands/invite.js`:

```js
// 发邀请
skyblock.Session.set("invite", target.xuid, player.xuid, 30);
// 30 秒内未 accept/refuse,自动作废

// accept 时
const inviterXuid = skyblock.Session.get("invite", player.xuid);
skyblock.Session.del("invite", player.xuid);
```

### 解散二次确认

`modules/commands/island.js`:

```js
// 第一次 /is disband
skyblock.Session.set("disband", player.xuid, player.islandId, 30);
player.sendMsg("请在 30 秒内再次输入 /is disband 以确认");

// 第二次 /is disband
if (skyblock.Session.has("disband", player.xuid)) {
    const islandId = skyblock.Session.get("disband", player.xuid);
    // 真的解散
}
```

## 你能用它做什么

任何"短时间内需要二次确认或追踪状态"的玩法:

- 重命名 / 危险操作的二次确认
- 玩家发起的临时挑战(N 秒内击败对方)
- 限时领奖(领取窗口 60 秒后失效)
- 命令冷却(参考 `level.js` 中 5 分钟 calc 冷却的写法——不过那个是手写 Map,用 Session 也行)

## 与 Store 的区别

| | `skyblock.Store` | `skyblock.Session` |
| --- | --- | --- |
| 过期机制 | 无 | 自动按 TTL 过期 |
| 是否分命名空间 | 单层 | 二层(namespace + key) |
| 用途 | 跨插件共享数据 / 函数 | 短期会话状态 |
| 写盘 | 不会 | 不会 |
| 重启后 | 清空 | 清空 |

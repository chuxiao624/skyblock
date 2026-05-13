# 故障排查

## 数据相关

### 怎么备份

直接保存 `plugins/skyblock/runtime/` 文件夹。

### 怎么删一个具体玩家的所有痕迹

最好直接走插件提供的清理路径，而不是手改 JSON：

实在要手改 JSON：

- `runtime/islands.json`：删 owner == xuid 的条目
- `runtime/index.json`：删该 xuid 的索引
- `runtime/permissions.json`：删该岛 id 对应的权限
- `runtime/warps.json`：删该岛 id 对应的传送点
- `runtime/admin_proxy.json`：如果他是代理中的管理员，删该条
- `runtime/playerinfo.json`：删该 xuid 的缓存条目

改完 **必须重启** 或 `/isa reload`，否则内存中的缓存还在。

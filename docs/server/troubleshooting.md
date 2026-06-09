# 故障排查

## 数据相关

### 怎么备份

直接保存 `plugins/skyblock/data/` 文件夹(玩家数据全在这);若改过全局配置,把 `plugins/skyblock/config/` 一并备份。

### 怎么删一个具体玩家的所有痕迹

最好直接走插件提供的清理路径，而不是手改 JSON：

实在要手改 JSON：

- `data/islands.json`：删 owner == xuid 的条目
- `data/index.json`：删该 xuid 的索引
- `data/permissions.json`：删该岛 id 对应的权限
- `data/warps.json`：删该岛 id 对应的传送点
- `data/admin_proxy.json`：如果他是代理中的管理员，删该条
- `plugins/playerinfo/playerinfo.json`：删该 xuid 的缓存条目

改完 **必须重启** 或 `/isa reload`，否则内存中的缓存还在。

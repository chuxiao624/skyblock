/**
 * 临时玩家信息收集
 * 由于 LSE 的 data.getAllPlayerInfo() 不可用，先在这里收集一下玩家的 xuid、名字
 * 等 LSE 修好 data.getAllPlayerInfo()。
 */

const PATH = "plugins/skyblock/runtime/playerinfo.json";
const _file = new JsonConfigFile(PATH, "{}");
const _cache = _file.init("data", {});   // xuid -> { name, xuid, lastSeen }

function record(player) {
    if (!player || !player.xuid) return;
    _cache[player.xuid] = {
        name: player.realName,
        xuid: player.xuid,
        lastSeen: Date.now(),
    };
    _file.set("data", _cache);
}

mc.listen("onJoin", (player) => record(player));

for (const p of mc.getOnlinePlayers() || []) record(p);

skyblock.Store.register("playerinfo:getAll", () => Object.values(_cache), true);
skyblock.Store.register("playerinfo:get", (xuid) => _cache[xuid] || null, true);

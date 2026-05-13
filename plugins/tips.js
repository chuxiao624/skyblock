

const CONST = {
    TELL_ACTIONBAR: 4
}

const STAY_MIN_INTERVAL = 1000;     // 1 秒提示一次
const _lastStayTip = new Map();     // xuid -> ts

skyblock.Event.on("player:enterIsland", (player, id) => {
    const isOwn = player.islandId === id;
    const head = isOwn ? "§a欢迎回来" : "§a你正在访问";
    player.setTitle(head, 2);
    player.setTitle(`§c${skyblock.island.getIslandName(id) ?? "未命名岛屿"}`, 3);
});

skyblock.Event.on("player:stayOnIsland", (player, id) => {
    const now = Date.now();
    const last = _lastStayTip.get(player.xuid) ?? 0;
    if (now - last < STAY_MIN_INTERVAL) return;
    _lastStayTip.set(player.xuid, now);

    const name = skyblock.island.getIslandName(id) ?? "未命名岛屿";
    player.tell(`你正在 ${name} 的岛屿`, CONST.TELL_ACTIONBAR);
});

skyblock.Event.on("player:leaveIsland", (player, id) => {
    const name = skyblock.island.getIslandName(id) ?? "未命名岛屿";
    player.tell(`你离开了 ${name} 的岛屿`, CONST.TELL_ACTIONBAR);
    _lastStayTip.delete(player.xuid);
});

const tipsConf = new JsonConfigFile("./plugins/skyblock/plugins/tips/data.json", "{}");

// { [islandId]: { welcome, footer } }
const tipsData = tipsConf.init("data", {});

const defaultTips = (id) => tipsData[id] ?? {
    welcome: "欢迎 {visitor} ~",
    footer: "你正在 {name} 的岛屿",
};

const saveTips = () => tipsConf.set("data", tipsData);

const resolveTip = (tpl, player, islandId) => tpl.replace("{name}", skyblock.island.getIslandName(islandId) ?? "未命名岛屿").replace("{visitor}", player.realName);

// 设置界面
const openIslandTipForm = (player) => {
    if (!player.guardOwner()) return

    const id = player.islandId;
    
    tipsData[id] ??= defaultTips(id);
    const cur = tipsData[id];
    const fm = mc.newCustomForm().setTitle("设置岛屿提示语");
    fm.addLabel("{name}：岛主名字 {visitor}：访客名字\n留空则不显示");
    fm.addInput("进入岛屿欢迎语", "", cur.welcome);
    fm.addInput("底部常驻提示", "", cur.footer);

    player.sendForm(fm, (player, dt) => {
        if (dt == null) return;

        tipsData[id].welcome = dt[1];
        tipsData[id].footer = dt[2];
        saveTips();

        player.tell("§a修改成功！");
    });
};

// 事件
skyblock.Event.on("player:enterIsland", (player, id) => {
    const tips = defaultTips(id);
    const isOwn = player.islandId === id;
    const head = isOwn ? "§a欢迎回来" : "§a你正在访问";

    player.setTitle(head, 2);

    if (tips.welcome) {
        player.setTitle(`§c${resolveTip(tips.welcome, player, id)}`, 3);
    }

});

skyblock.Event.on("player:stayOnIsland", (player, id) => {
    if (player.islandId === id) return;
    const footer = defaultTips(id).footer;
    if (footer) player.tell(resolveTip(footer, player, id), 4);
});

skyblock.Event.on("player:leaveIsland", (player, id) => {
    const footer = defaultTips(id).footer;
    if (footer) player.tell(`你离开了 ${resolveTip(footer, player, id)}`, 4);
});

// 指令注册
skyblock.Command.registerAll({
    "tip": (origin) => openIslandTipForm(origin.player)
});
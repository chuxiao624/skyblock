// 菜单构建工具
function buildMenu(player, title, items) {
    const labels = items.map(i => i.label);
    const images = items.map(i => i.img ?? "");

    player.sendSimpleForm(title, "", labels, images, (player, id) => {
        if (id == null) return;
        const item = items[id];
        if (!item) return;

        if (item.cmd) player.runcmd(item.cmd);
        if (item.tell) player.sendMsg(item.tell);
        if (item.sub) item.sub(player);
    });
}


function openInviteMenu(player) {
    const onlinePlayers = mc.getOnlinePlayers().filter(p => p.xuid !== player.xuid);

    if (onlinePlayers.length === 0) {
        player.sendMsg("§c当前没有其他在线玩家！");
        return;
    }

    buildMenu(player, "邀请玩家", [
        ...onlinePlayers.map(p => ({
            label: p.realName,
            img: "textures/items/skull_steve",
            cmd: `is invite ${p.realName}`,
        })),
        { label: "§l返回上一级", sub: openIslandSettingMenu, img: "textures/items/arrow" },
    ]);
}

// 主菜单 
function openMainMenu(player) {
    buildMenu(player, "/D 菜单", [
        { label: "返回岛屿", sub: () => { player.islandId ? player.runcmd("is spawn") : player.runcmd("is create") } },
        { label: "岛屿挑战", cmd: "is challenge" },
        { label: "岛屿等级", sub: openLevelMenu },
        { label: "钱包", tell: "钱包" },
        { label: "传送点", sub: openWarpMenu },
        { label: "玩家传送", cmd: "tpa gui" },
        { label: "公开传送点", cmd: "is warp public" },
        { label: "回到主城", cmd: "is hub" },
        { label: "公告图片", tell: "你好" },
        { label: "岛屿设置", sub: openIslandSettingMenu },
        { label: "岛屿权限设置", sub: openPermsMenu },
        { label: "岛屿帮助", cmd: "is help" },
    ]);
}

// 传送点菜单
function openWarpMenu(player) {
    buildMenu(player, "岛屿传送点", [
        { label: "岛屿传送点", cmd: "is warp list", img: "textures/items/ender_pearl" },
        { label: "切换传送点状态", cmd: "is warp toggle", img: "textures/items/bed_red" },
        { label: "§l返回上一级", sub: openMainMenu, img: "textures/items/arrow" },
    ]);
}

// 信任权限菜单 
function openPermsMenu(player) {
    buildMenu(player, "信任权限", [
        { label: "岛屿权限", cmd: "is perm edit", img: "textures/items/paper" },
        { label: "岛屿白名单列表", cmd: "is perm allowlist", img: "textures/items/paper" },
        { label: "§l返回上一级", sub: openMainMenu, img: "textures/items/arrow" },
    ]);
}

// 岛屿设置菜单
function openIslandSettingMenu(player) {
    buildMenu(player, "岛屿设置", [
        { label: "设置欢迎语", cmd: "is tip", img: "textures/items/sign" },
        { label: "设置出生点", cmd: "is setspawn", img: "textures/blocks/bed_head_top_red" },
        { label: "邀请玩家", sub: openInviteMenu, img: "textures/items/skull_steve" },
        { label: "§c转让岛屿", cmd: "is transfer", img: "textures/items/tnt_minecart" },
        { label: "§c删除岛屿", cmd: "is delete", img: "textures/items/tnt_minecart" },
        { label: "§l返回上一级", sub: openMainMenu, img: "textures/items/arrow" },
    ]);
}

// 等级菜单 
function openLevelMenu(player) {
    buildMenu(player, "岛屿等级", [
        { label: "计算岛屿等级", cmd: "is level calc", img: "textures/items/diamond" },
        { label: "获取方块价值", cmd: "is level check", img: "textures/items/gold_ingot" },
        { label: "等级排行榜", cmd: "is level top", img: "textures/items/trophy" },
        { label: "§l返回上一级", sub: openMainMenu, img: "textures/items/arrow" },
    ]);
}

// 命令注册
skyblock.Command.runIs = (origin) => {
    if (origin.player) openMainMenu(origin.player);
};

// 注册主城命令
skyblock.Command.registerAll({
    "hub": (origin) => {
        const player = origin.player;
        if (!player) return;
        player.teleport(...skyblock.config.get("respawn"));
    },
});

// 进服给钟
const CLOCK_NBT = `{"Count":1b,"Damage":0s,"Name":"minecraft:clock","WasPickedUp":0b,"tag":{"minecraft:item_lock":2b,"minecraft:keep_on_death":1b}}`;

mc.listen("onJoin", (player) => {
    const hasClock = player.getInventory().getAllItems()
        .some(item => item.type === "minecraft:clock");

    if (!hasClock) {
        player.giveItem(mc.newItem(NBT.parseSNBT(CLOCK_NBT)));
    }
});
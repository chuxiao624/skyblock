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
        ...onlinePlayers.map(p => ({ label: p.realName, img: "textures/ui/invite_base", cmd: `is invite ${p.realName}` })),
        { label: "§l返回上一级", sub: openIslandSettingMenu, img: "textures/items/arrow" },
    ]);
}

// 主菜单
function openMainMenu(player) {
    buildMenu(player, "/D 菜单", [
        { label: "返回岛屿", img: "textures/blocks/beacon", sub: () => { player.islandId ? player.runcmd("is spawn") : player.runcmd("is create") } },
        { label: "岛屿挑战", img: "textures/items/nether_star", cmd: "is challenge" },
        { label: "岛屿等级", img: "textures/ui/trophy", sub: openLevelMenu },
        { label: "钱包", img: "textures/ui/icon_minecoin_9x9", tell: "钱包" },
        { label: "传送点", img: "textures/items/ender_pearl", sub: openWarpMenu },
        { label: "玩家传送", img: "textures/ui/multiplayer_glyph_color", cmd: "tpa gui" },
        { label: "公开传送点", img: "textures/items/compass_item", cmd: "is warp public" },
        { label: "回到主城", img: "textures/ui/store_home_icon", cmd: "is hub" },
        { label: "公告图片", img: "textures/items/book_normal", tell: "你好" },
        { label: "岛屿设置", img: "textures/ui/gear", sub: openIslandSettingMenu },
        { label: "岛屿权限设置", img: "textures/ui/permissions_op_crown", sub: openPermsMenu },
        { label: "岛屿帮助", img: "textures/items/book_normal", cmd: "is help" },
    ]);
}

// 传送点菜单
function openWarpMenu(player) {
    buildMenu(player, "岛屿传送点", [
        { label: "岛屿传送点", img: "textures/items/ender_pearl", cmd: "is warp list" },
        { label: "切换传送点状态", img: "textures/items/bed_red", cmd: "is warp toggle" },
        { label: "§l返回上一级", sub: openMainMenu, img: "textures/items/arrow" },
    ]);
}

// 信任权限菜单
function openPermsMenu(player) {
    buildMenu(player, "信任权限", [
        { label: "岛屿权限", img: "textures/ui/permissions_op_crown", cmd: "is perm edit" },
        { label: "岛屿白名单列表", img: "textures/items/paper", cmd: "is perm allowlist" },
        { label: "§l返回上一级", sub: openMainMenu, img: "textures/items/arrow" },
    ]);
}

// 岛屿设置菜单
function openIslandSettingMenu(player) {
    buildMenu(player, "岛屿设置", [
        { label: "设置欢迎语", img: "textures/items/sign", cmd: "is tip" },
        { label: "设置出生点", img: "textures/items/bed_red", cmd: "is setspawn" },
        { label: "邀请玩家", img: "textures/ui/invite_base", sub: openInviteMenu },
        { label: "§c转让岛屿", img: "textures/ui/permissions_op_crown", cmd: "is transfer" },
        { label: "§c删除岛屿", img: "textures/blocks/tnt_side", cmd: "is disband" },
        { label: "§l返回上一级", sub: openMainMenu, img: "textures/items/arrow" },
    ]);
}

// 等级菜单
function openLevelMenu(player) {
    buildMenu(player, "岛屿等级", [
        { label: "计算岛屿等级", img: "textures/items/diamond", cmd: "is level calc" },
        { label: "获取方块价值", img: "textures/items/gold_ingot", cmd: "is level check" },
        { label: "等级排行榜", img: "textures/ui/trophy", cmd: "is level top" },
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
    const hasClock = player.getInventory().getAllItems().some(item => item.type === "minecraft:clock");

    if (!hasClock) {
        player.giveItem(mc.newItem(NBT.parseSNBT(CLOCK_NBT)));
    }
});
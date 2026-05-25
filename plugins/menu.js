const UI_TAG = {
    route: { grid: '§g§r§i§d' },
    btn: {
        item: '§i§t§e§m',
        nav: '§n§a§v',
        navActive: '§n§a§v§a§c§t',
        title: '§t§i§t§l§e',
        back: '§b§a§c§k',
    },
};

function buildCategories(player) {

    const invitees = mc.getOnlinePlayers()
        .filter(p => p.xuid !== player.xuid)
        .map(p => ({
            label: p.realName,
            img: 'textures/ui/invite_base',
            cmd: `is invite ${p.realName}`,
        }));

    return [
        {
            label: '主菜单', icon: 'textures/blocks/beacon',
            items: [
                {
                    label: '返回岛屿', img: 'textures/blocks/beacon',
                    sub: (pl) => pl.islandId ? pl.runcmd('is spawn') : pl.runcmd('is create'),
                },
                { label: '岛屿挑战', img: 'textures/items/nether_star', cmd: 'is challenge' },
                { label: '钱包', img: 'textures/ui/icon_minecoin_9x9', tell: '钱包' },
                { label: '玩家传送', img: 'textures/ui/multiplayer_glyph_color', cmd: 'tpa gui' },
                { label: '公开传送', img: 'textures/items/compass_item', cmd: 'is warp public' },
                { label: '回到主城', img: 'textures/ui/store_home_icon', cmd: 'is hub' },
                { label: '公告图片', img: 'textures/items/book_normal', tell: '你好' },
                { label: '岛屿帮助', img: 'textures/items/book_normal', cmd: 'is help' },
            ],
        },
        {
            label: '等级', icon: 'textures/ui/trophy',
            items: [
                { label: '计算等级', img: 'textures/items/diamond', cmd: 'is level calc' },
                { label: '方块价值', img: 'textures/items/gold_ingot', cmd: 'is level check' },
                { label: '等级排行', img: 'textures/ui/trophy', cmd: 'is level top' },
            ],
        },
        {
            label: '传送点', icon: 'textures/items/ender_pearl',
            items: [
                { label: '传送列表', img: 'textures/items/ender_pearl', cmd: 'is warp list' },
                { label: '切换状态', img: 'textures/items/bed_red', cmd: 'is warp toggle' },
            ],
        },
        {
            label: '邀请玩家', icon: 'textures/ui/invite_base',
            items: invitees.length > 0 ? invitees : [
                { label: '§c无人在线', img: 'textures/ui/invite_base', tell: '§c无人在线' },
            ],
        },
        {
            label: '岛屿设置', icon: 'textures/ui/gear',
            items: [
                { label: '设置欢迎语', img: 'textures/items/sign', cmd: 'is tip' },
                { label: '设置出生点', img: 'textures/items/bed_red', cmd: 'is setspawn' },
                { label: '§c转让岛屿', img: 'textures/ui/permissions_op_crown', cmd: 'is transfer' },
                { label: '§c删除岛屿', img: 'textures/blocks/tnt_side', cmd: 'is disband' },
            ],
        },
        {
            label: '岛屿权限', icon: 'textures/ui/permissions_op_crown',
            items: [
                { label: '岛屿权限', img: 'textures/ui/permissions_op_crown', cmd: 'is perm edit' },
                { label: '白名单', img: 'textures/items/paper', cmd: 'is perm allowlist' },
            ],
        },
    ];
}


function openMainMenu(player, selectedCategory = 0) {

    const categories = buildCategories(player);
    if (selectedCategory < 0 || selectedCategory >= categories.length) selectedCategory = 0;
    const items = categories[selectedCategory].items;

    const fm = mc.newSimpleForm().setTitle(UI_TAG.route.grid);

    // 1) 右侧网格条目
    for (const it of items) {
        fm.addButton(`\n${it.label}${UI_TAG.btn.item}`, it.img || '');
    }

    // 2) 左侧导航
    for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const tag = (i === selectedCategory) ? UI_TAG.btn.navActive : UI_TAG.btn.nav;
        fm.addButton(`${cat.label}${tag}`, cat.icon);
    }

    // 3) 顶栏
    fm.addButton(`菜单${UI_TAG.btn.title}`);
    fm.addButton(`返回${UI_TAG.btn.back}`);

    const itemEnd = items.length;
    const navEnd = itemEnd + categories.length;

    player.sendForm(fm, (pl, id) => {
        if (id == null) return;

        if (id < itemEnd) {
            const it = items[id];
            if (it.cmd) pl.runcmd(it.cmd);
            if (it.tell) pl.sendMsg(it.tell);
            if (it.sub) it.sub(pl);
            return;
        }

        if (id < navEnd) {
            openMainMenu(pl, id - itemEnd);
            return;
        }
        const topbarIdx = id - navEnd;
        if (topbarIdx === 0) openMainMenu(pl, selectedCategory);
    });
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


mc.listen("onUseItem", (player, item) => {
    if (item.type === "minecraft:clock") {
        openMainMenu(player);
    }
});

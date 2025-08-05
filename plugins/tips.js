
const tips_flie = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\tips\\config.json', '{}');

const tips_data = tips_flie.init("data", {});

function islandWelcome(player) {

    let id = player.islandID;

    if (id == null) return player.sendMsg("§c你还没有岛屿");

    tips_data[id] ??= {
        welcome: "欢迎 {visitor} ~",
        footer: "你正在{name}的岛屿",
    }

    let pl_data = tips_data[id]

    let fm = mc.newCustomForm().setTitle("设置岛屿欢迎语")

    fm.addLabel("{name} : 你的名字\n{visitor} : 访客名字\n留空则不显示")

    fm.addInput("进入岛屿的欢迎语", "", pl_data.welcome)

    fm.addInput("底部常驻提示", "", pl_data.footer)

    player.sendForm(fm, (player, dt) => {

        if (dt == null) return false;

        if (dt[0] == '') return player.sendMsg("§c请输入内容");

        tips_data[id].welcome = dt[1];
        tips_data[id].footer = dt[2];


        player.sendMsg("§a修改成功!");

        tips_flie.set("data", tips_data);

    })



}






skyblock.Event.listen("onEnterIsland", (player, id) => {

    let str = player.islandID == id ? "§a欢迎回来" : "§a你正在访问"

    player.setTitle(str, 2)

    let name = skyblock.Locator.data[id].name

    player.setTitle(`§c${name}`, 3)

    if (player.islandID == id) return;

    if (tips_data[id] && tips_data[id].welcome != "") {

        let str2 = tips_data[id].welcome.replace("{name}", name).replace("{visitor}", player.realName);

        player.sendMsg(str2);

    }


})


skyblock.Event.listen("onInisland", (player, id) => {

    if (player.islandID === id) return;

    const name = skyblock.Locator.data[id]?.name || "未知玩家";

    if (tips_data[id]) {

        const str = tips_data[id].footer.replace("{name}", name).replace("{visitor}", player.realName);

        player.tell(str, 5);

        return;
    }

    player.tell(`你正在${name}的岛屿`, 5);
});



skyblock.Event.listen("onLeaveIsland", (player, id) => {

    player.tell(`你离开了 ${skyblock.Locator.data[id].name} 的岛屿`, 4)

})


skyblock.Event.listen("onRegisterCommand", (Enum, cmd, map) => {

    map.push(

        [
            (context) => context.res.tip == "tip",
            (context) => {

                let player = context._ori.player;

                islandWelcome(player);

            }
        ]

    )

    cmd.setEnum("tip", ["tip"])

    cmd.mandatory("tip", ParamType.Enum, "tip", 1)

    cmd.overload(["tip"])

})

skyblock.__i18n.translations["island.help"] += "/is tip 设置岛屿欢迎\n";
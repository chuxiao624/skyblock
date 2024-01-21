
const warp_flie = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\warp\\data.json', '{}');



const warp_cfg = warp_flie.init("max_warps", 5);

let warp_data = warp_flie.init("data", {})


function initPlayerPos(player, name, description, open) {

    return {
        name: name,
        x: parseInt(player.pos.x),
        y: parseInt(player.pos.y),
        z: parseInt(player.pos.z),
        dimid: player.pos.dimid,
        description: description,
        open: open
    }

}

function createWarp(player) {

    if (player.islandID == null) return player.sendMsg(skyblock.__i18n.tr("error.island.not_exist"));

    if (player.islandID != player.inIsland) return player.sendMsg(skyblock.__i18n.tr("error.island.not_in_island"));

    let warps = warp_data[player.xuid];

    if (warps?.length >= warp_cfg) return player.sendMsg("§c传送点已达上限");

    let fm = mc.newCustomForm().setTitle("创建传送点")

    fm.addInput("输入传送点名称:")

    fm.addInput("传送点描述:")

    fm.addSwitch("是否公开", true)

    player.sendForm(fm, (player, dt) => {

        if (dt == null) return false;

        if (dt[0] == '') return player.sendMsg("§c请输入传送点名称");

        warp_data[player.xuid] ??= [];

        warp_data[player.xuid].push(initPlayerPos(player, dt[0], dt[1], dt[2]))

        player.sendMsg("§a创建成功!");

        warp_flie.set("data", warp_data);

    })

}

function deleteWarp(player) {

    if (player.islandID == null) return player.sendMsg(skyblock.__i18n.tr("error.island.not_exist"));

    let warps = warp_data[player.xuid];

    if (!warps?.length) return player.sendMsg("§c你还没有传送点!");

    let fm = mc.newSimpleForm().setTitle("删除岛屿传送点")

    warps.forEach((item) => fm.addButton(item.name))

    player.sendForm(fm, (player, id) => {

        if (id == null) return false

        player.sendModalForm("删除传送点", "你确定删除该传送点吗", "确定", "取消", (player, result) => {

            if (!result) return false

            warps.splice(id, 1)

            warp_flie[player.xuid] = warps;

            player.sendMsg("§a删除成功!");

            warp_flie.set("data", warp_data);

        })

    })


}

function setupWarp(player) {

    if (player.islandID == null) return player.sendMsg(skyblock.__i18n.tr("error.island.not_exist"));

    let warps = warp_data[player.xuid];

    if (!warps?.length) return player.sendMsg("§c你还没有传送点!");

    let fm = mc.newCustomForm().setTitle("删除岛屿传送点")

    warps.forEach((item) => {

        fm.addInput("传送点名称", "", item.name)

        fm.addInput("传送点描述", "", item.description)

        fm.addSwitch("是否开放", item.open);

    })

    player.sendForm(fm, (player, dt) => {

        if (dt == null) return false

        warp_data[player.xuid] = warps.map((item, index) => {

            return { ...item, name: dt[index * 3], description: dt[index * 3 + 1], open: dt[index * 3 + 2] };

        });

        player.sendMsg("§a修改成功!");

        warp_flie.set("data", warp_data);

    })


}
function getPlayerWarp(player) {

    let warps = warp_data[player.xuid];

    if (!warps?.length) return player.sendMsg("§c你还没有传送点!");

    let fm = mc.newSimpleForm().setTitle("我的传送点");

    warps.forEach((item) => {

        fm.addButton(`§l${item.name}§r\n§8${item.description}`);

    })

    player.sendForm(fm, (player, id) => {

        if (id == null) return false

        const { x, y, z, dimid } = warps[id];

        player.teleport(x, y, z, dimid);

    })
}



function getPlayerOpenWarp(xuid) {

    let warps = warp_data[xuid];

    warps = warps.filter((item) => item.open);

    if (warps.length == 0) return false;

    return warps;

}


function toPlayerWarp(player, warp) {

    let fm = mc.newSimpleForm().setTitle("岛屿传送点")

    warp.forEach((item) => {

        fm.addButton(`§l${item.name} §r\n§8${item.description}`);

    })


    player.sendForm(fm, (player, id) => {

        if (id == null) return false

        const { x, y, z, dimid } = warp[id]

        player.teleport(x, y, z, dimid);

    })




}




function getWarpList(player) {

    let openWarps = {}

    let openWarpsKey = []

    Object.keys(warp_data).forEach((key) => {

        let opens = getPlayerOpenWarp(key)

        if (opens) {

            openWarps[key] = [...opens]

            openWarpsKey.push(key)

        }

    })

    let fm = mc.newSimpleForm().setTitle("岛屿传送点")


    openWarpsKey.forEach((key) => {


        fm.addButton(`§l${data.xuid2name(key)}`);


    })


    player.sendForm(fm, (player, id) => {

        if (id == null) return false

        const xuid = openWarpsKey[id]

        toPlayerWarp(player, openWarps[xuid])

    })



}


skyblock.Event.listen("onDeleteIsland", (player) => {

    if (warp_data[player.xuid]) {

        delete warp_data[player.xuid];

        warp_flie.set("data", warp_data);

    }

})


skyblock.Event.listen("onRegisterCommand", (Enum, cmd, map) => {

    map.push(

        [
            (context) => context.res.warp == "warp",
            (context) => {
                let player = context._ori.player;

                switch (context.res.warpoper) {

                    case "create":
                        createWarp(player);
                        break;
                    case "delete":
                        deleteWarp(player);
                        break;
                    case "set":
                        setupWarp(player);
                        break;
                    case "get":
                        getPlayerWarp(player);
                        break;
                    case "list":
                        getWarpList(player);
                        break;
                }
            }
        ]

    )

    cmd.setEnum("warp", ["warp"])

    cmd.setEnum("warpoper", ["create", "delete", "set", "get", "list"])


    cmd.mandatory("warp", ParamType.Enum, "warp", 1)

    cmd.mandatory("warpoper", ParamType.Enum, "warpoper", 1)


    cmd.overload(["warp", "warpoper"])


})

skyblock.__i18n.translations["island.help"] += "/is warp create  创建传送点\n/is warp get 查看传送点\n/is warp list 查看公开传送点列表\n/is warp set 设置传送点是否公开 \n/is warp remove 删除传送点\n";
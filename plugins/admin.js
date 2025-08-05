

const admin_flie = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\admin\\data.json', '{}');
const admin_cache_flie = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\admin\\data.json', '{}');

let admin_cache = admin_cache_flie.init("data", {});

let admin_data = admin_flie.init("data", {});

function showPlayersIsland(player) {

    let fm = mc.newSimpleForm().setTitle("岛屿管理")

    const DATA = skyblock.Locator.data


    const array1 = Object.keys(DATA);
    const array2 = Object.keys(admin_data);

    const arr = array1.filter(element => !array2.includes(element));


    arr.forEach(key => fm.addButton(DATA[key].name))

    player.sendForm(fm, (player, data) => {

        if (data == null) return

        setPlayerIsland(player, arr[data])

    })

}


function expandRectangle(coordinates, expandSize) {

    let [[x1, y1], [x2, y2]] = coordinates;

    if (x1 > x2 || y1 > y2) {

        [x1, y1, x2, y2] = [x2, y2, x1, y1];

    }

    const expandedX1 = x1 - expandSize;
    const expandedY1 = y1 - expandSize;
    const expandedX2 = x2 + expandSize;
    const expandedY2 = y2 + expandSize;

    return [[expandedX1, expandedY1], [expandedX2, expandedY2]];

}


function setPlayerIsland(player, island) {

    let fm = mc.newSimpleForm().setTitle("岛屿管理")

    fm.addButton("传送到玩家岛屿")
    fm.addButton("删除岛屿")
    fm.addButton("扩建岛屿")
    fm.addButton("缩小岛屿")


    const DATA = skyblock.Locator.data[island]

    let xuid = DATA.xuid

    player.sendForm(fm, (player, id) => {

        if (id == null) return showPlayersIsland(player)

        switch (id) {

            case 0:

                let pos = DATA.spawn[xuid]

                player.teleport(...pos)

                break;
            case 1:

                player.sendModalForm('删除岛屿', "你确定删除该岛屿?", "确定", "取消", (player, result) => {


                    if (!result) return setPlayerIsland(player, island)


                    skyblock.Locator.deleteIsland(
                        {
                            islandID: island,
                            xuid: xuid
                        }
                    )

                    player.sendMsg("删除成功!")

                })

                break;

            case 2:

                let fm = mc.newCustomForm().setTitle("岛屿管理");

                fm.addInput("输入要扩建的范围 正数为增加 负数为减少");

                player.sendForm(fm, (player, data) => {

                    if (data == null) return setPlayerIsland(player, island)

                    if (data[0] == '' || isNaN(data[0])) return player.sendMsg("请输入正确的数字!")

                    let Range = DATA.range

                    let Num = Math.floor(data[0]);

                    Range = expandRectangle(Range, Num);

                    skyblock.Locator.setIslandData(island, "range", Range)

                    player.sendMsg("扩建成功!")

                })

                break;

            default:
                break;
        }
    })

}



function createCustomIsland(player) {

    let fm = mc.newCustomForm().setTitle("岛屿管理")

    fm.addInput("请输入岛屿名")

    player.sendForm(fm, (player, dt) => {

        if (dt == null) return

        let key = dt[0]

        let fm2 = mc.newSimpleForm().setTitle("创建岛屿")

        let blueprints = skyblock.config.get("blueprint");

        blueprints.forEach((value) => {

            fm2.addButton(`${value.name} \n ${value.description}`)

        })

        player.sendForm(fm2, (player, id) => {

            if (id == null) return

            let customIsland = skyblock.Locator.createIsland(player, blueprints[id], false)

            skyblock.Locator.setIslandData(customIsland, "name", key)

            admin_data[customIsland] = key

            player.sendMsg("创建成功!")

            admin_flie.set("data", admin_data)

        })

    });


}



function showCustomIsland(player) {

    let fm = mc.newSimpleForm().setTitle("岛屿管理");

    let keys = Object.keys(admin_data)


    keys.forEach(key => {

        fm.addButton(admin_data[key])

    })

    player.sendForm(fm, (player, id) => {

        if (id == null) return adminMenu(player)

        let spawn = skyblock.Locator.data[keys[id]].spawn

        player.teleport(...spawn[Object.keys(spawn)[0]])

    })

}


function setCustomIsland(player) {

    let customID = player.inIsland

    if (!admin_data.hasOwnProperty(customID)) {
        player.sendMsg("你必须在自定义岛屿中!")
        return false
    }


    let fm = mc.newSimpleForm().setTitle("岛屿管理")

    fm.addButton("权限设置")

    fm.addButton("创建传送点")

    fm.addButton("删除岛屿传送点")

    fm.addButton("删除岛屿")

    player.sendForm(fm, (player, id) => {

        if (id == null) return showCustomIsland(player)

        switch (id) {

            case 0:

                setCustomIslandPermission(player, customID)

                break;

            case 1:

                createIslandSpawn(player, customID)

                break;

            case 2:

                deleteIslandSpawn(player, customID)

                break;
            case 3:


                player.sendModalForm('删除岛屿', "你确定删除该岛屿?", "确定", "取消", (player, result) => {


                    if (!result) return setCustomIsland(player)


                    skyblock.Locator.deleteIsland(
                        {
                            islandID: customID,
                        }, false
                    )

                    delete admin_data[customID];

                    admin_flie.set("data", admin_data);

                    player.sendMsg("删除成功!")

                })

                break;
            default:
                break;
        }
    })

}

function setCustomIslandPermission(player, id) {

    if (id == null) return context.out.error(skyblock.__i18n.tr("error.island.not_exist"))

    let perms = skyblock.Perms.getPermissionList(id)

    let permsKeys = Object.keys(perms)

    let fm = mc.newCustomForm().setTitle(skyblock.__i18n.tr("form.set.perms.title"))

    fm.addLabel(skyblock.__i18n.tr("form.set.perms.description"))

    permsKeys.forEach(key => {

        fm.addSwitch(skyblock.__i18n.tr(`permission.${key}`), perms[key])

    })

    player.sendForm(fm, (player, data) => {

        if (data == null) return;

        let obj = {}

        permsKeys.forEach((key, index) => obj[key] = data[index + 1]);

        skyblock.Perms.setPermission(id, true, obj);

        player.sendMsg(skyblock.__i18n.tr("form.set.perms.success"));

    })

}


function initPlayerPos(player) {

    return [
        parseInt(player.pos.x),
        parseInt(player.pos.y),
        parseInt(player.pos.z),
        player.pos.dimid,
    ]

}
function createIslandSpawn(player, id) {

    let fm = mc.newCustomForm().setTitle("创建传送点")

    fm.addInput("输入传送点名称:")

    player.sendForm(fm, (player, dt) => {

        if (dt == null) return false;

        if (dt[0] == '') return player.sendMsg("§c请输入传送点名称");

        const spawn = skyblock.Locator.data[id].spawn

        spawn[dt[0]] = initPlayerPos(player)

        player.sendMsg("§a创建成功!");

        skyblock.Locator.setIslandData(id, "spawn", spawn)


    })


}


function deleteIslandSpawn(player, id) {

    const spawn = skyblock.Locator.data[id].spawn

    let warps = Object.keys(spawn)

    let fm = mc.newSimpleForm().setTitle("删除岛屿传送点")

    warps.forEach((item) => fm.addButton(item))

    player.sendForm(fm, (player, id) => {

        if (id == null) return false

        player.sendModalForm("删除传送点", "你确定删除该传送点吗", "确定", "取消", (player, result) => {

            if (!result) return false

            delete spawn[warps[id]]

            player.sendMsg("§a删除成功!");

            skyblock.Locator.setIslandData(id, "spawn", spawn)

        })

    })

}


function adminMenu(player) {


    let fm = mc.newSimpleForm().setTitle("岛屿管理")

    fm.addButton("管理玩家岛屿")

    fm.addButton("创建自定义岛屿")

    fm.addButton("管理自定义岛屿")


    player.sendForm(fm, (player, data) => {

        if (data == null) return false

        switch (data) {
            case 0:
                showPlayersIsland(player)
                break;
            case 1:
                createCustomIsland(player)
                break;
            case 2:
                showCustomIsland(player)
                break;
            default:
                break;
        }
    })

}

function name2id(name) {

    let keys = Object.keys(admin_data)

    for (let i = 0; i < keys.length; i++) {

        if (admin_data[keys[i]] == name) return keys[i]

    }

    return null

}

function gotoCustomIsland(player, name, warp) {

    let id = name2id(name)

    if (id == null) return player.sendMsg("§c该岛屿不存在!")

    let spawn = skyblock.Locator.data[id].spawn

    let pos = spawn[warp]

    if (pos == null) return player.sendMsg("§c该传送点不存在!")

    player.teleport(...pos)
}

skyblock.Event.listen("onRegisterCommand", (Enum, cmd, map) => {

    map.push(

        [
            (context) => context.res.manage == "manage",
            (context) => {

                let player = context._ori.player;

                if (context.res.tp == "tp") {

                    return gotoCustomIsland(player, context.res.name, context.res.point)

                }

                if (!player.isOP()) return player.sendMsg("§c你没有权限使用该指令!")

                switch (context.res.manageoper) {

                    case "set":

                        setCustomIsland(player)
                        break;

                    case "exit":

                        let id = admin_cache[player.xuid]

                        skyblock.Locator.ids_data[player.xuid] = id;

                        delete admin_cache[player.xuid]

                        admin_cache_flie.set("data", admin_cache);

                        player.sendMsg("§a已退出代理模式");

                        break;

                    case "proxy":

                        admin_cache[player.xuid] = player.islandID;

                        skyblock.Locator.ids_data[player.xuid] = player.inIsland;

                        admin_cache_flie.set("data", admin_cache);

                        player.sendMsg("§a你已代理该岛屿 输入 §e/is manage exit §a退出代理");

                        break;

                    default:
                        adminMenu(player)
                        break;
                }

            }
        ]

    )

    cmd.setEnum("manage", ["manage"])

    cmd.setEnum("manageoper", ["set", "proxy", "exit"])

    cmd.setEnum("tp", ["tp"])

    cmd.mandatory("manage", ParamType.Enum, "manage", 1)

    cmd.mandatory("manageoper", ParamType.Enum, "manageoper", 1)

    cmd.mandatory("tp", ParamType.Enum, "tp", 1)

    cmd.mandatory("name", ParamType.String)

    cmd.mandatory("point", ParamType.RawText)

    cmd.overload(["manage"])

    cmd.overload(["manage", "manageoper"])

    cmd.overload(["manage", "tp", "name", "point"])


})

function addPermsToPlayer(player) {

    const allInfo = data.getAllPlayerInfo().map(item => item.xuid);

    const online = mc.getOnlinePlayers().map(item => item.xuid);

    const offline = allInfo.filter(xuid => !online.includes(xuid));

    let fm = mc.newSimpleForm().setTitle('添加权限')

    fm.addButton('在线玩家')

    fm.addButton('离线玩家')

    player.sendForm(fm, (player, id) => {

        if (id == null) return

        switch (id) {

            case 0:

                showPlayer(player, online)

                break;

            case 1:

                showPlayer(player, offline)

                break;

            default:
                break;
        }

    })


}

function showPlayer(player, list) {

    let fm = mc.newCustomForm().setTitle("添加权限");

    const names = list.map(item => data.xuid2name(item));

    fm.addDropdown("选择玩家", names)

    player.sendForm(fm, (player, dt) => {

        if (dt == null) return

        showPerms(player, names[dt[0]], list[dt[0]])

    })

}


function showPerms(player, name, xuid) {

    // if (xuid == player.xuid) return player.sendMsg("不能给自己添加权限");

    let perms = skyblock.Perms.getPermissionList(player.islandID)

    let keys = Object.keys(perms)

    let fm = mc.newCustomForm().setTitle(`添加权限至 ${name}`)

    keys.forEach(key => {

        fm.addSwitch(skyblock.__i18n.tr(`permission.${key}`), false);

    })

    player.sendForm(fm, (player, dt) => {

        if (dt == null) return;

        const result = dt.map((k, i) => k ? keys[i] : null).filter(item => item !== null);

        if (result.length > 0) {

            skyblock.Perms.addPermissionsToPlayer(xuid, player.islandID, result);

            player.sendMsg("§a添加权限成功");

        } else {

            player.sendMsg("§c你没有选择任何权限");

        }

    })

}


function editPerms(player, name, xuid) {

    const Perms = skyblock.Perms.getPermission(player.islandID)

    let whitelist = Perms.whitelist[xuid];

    let keys = Object.keys(Perms.permissions);

    let fm = mc.newCustomForm().setTitle(`编辑 §e${name}§r 的权限`)

    keys.forEach(key => {

        fm.addSwitch(skyblock.__i18n.tr(`permission.${key}`), whitelist.includes(key));

    })

    player.sendForm(fm, (player, dt) => {

        if (dt == null) return;

        const result = dt.map((k, i) => k ? keys[i] : null).filter(item => item !== null);

        if (result.length > 0) {

            skyblock.Perms.addPermissionsToPlayer(xuid, player.islandID, result, true);

            player.sendMsg("§a修改权限成功");

        } else {

            player.sendMsg(`§c你关闭了所有权限，将自动移除玩家信任`);

            removePerms(player, xuid);

        }

    })

}

function editPermsForm(player) {

    let fm = mc.newSimpleForm().setTitle(`编辑信任名单`)

    let Perms = skyblock.Perms.getPermission(player.islandID);

    let list = Object.keys(Perms.whitelist)


    list.forEach(item => {


        fm.addButton(data.xuid2name(item))

    })

    player.sendForm(fm, (player, id) => {

        if (id == null) return

        let xuid = list[id]

        editPerms(player, data.xuid2name(list[id]), xuid)

    })

}


function removePerms(player, xuid) {

    let Perms = skyblock.Perms.getPermission(player.islandID)

    delete Perms.whitelist[xuid];

    skyblock.Perms.setPermission(player.islandID, false, Perms.whitelist, "whitelist")

}

function removePermsForm(player) {

    let Perms = skyblock.Perms.getPermission(player.islandID);

    let fm = mc.newSimpleForm().setTitle('删除信任名单')

    let keys = Object.keys(Perms.whitelist)

    keys.forEach(item => {

        fm.addButton(data.xuid2name(item))

    })


    player.sendForm(fm, (player, id) => {

        if (id == null) return

        let xuid = keys[id]

        player.sendModalForm('移除信任名单', `你确定移除 ${data.xuid2name(xuid)} 的信任权限吗?`, "确定", "取消", (player, result) => {

            if (!result) return

            removePerms(player, keys[id])

            player.sendMsg("§a移除成功");

        })

    })


}


function getPermsList(player) {

    let Perms = skyblock.Perms.getPermission(player.islandID);

    const whitelistNames = Object.keys(Perms.whitelist).map(item => data.xuid2name(item));

    player.sendMsg(whitelistNames)

    return whitelistNames;

}


skyblock.Event.listen("onRegisterCommand", (Enum, cmd, map) => {

    map.push(

        [
            (context) => context.res.perms == "perms",
            (context) => {

                let player = context._ori.player;

                if (player.islandID == null) {

                    return player.sendMsg("§c你还没有岛屿");

                }

                let Perms = skyblock.Perms.getPermission(player.islandID);

                let length = Object.keys(Perms.whitelist).length;

                switch (context.res.permskey) {

                    case "add":

                        addPermsToPlayer(player);

                        break;
                    case "remove":

                        if (length == 0) return player.sendMsg("§c你还没有信任名单");

                        removePermsForm(player);

                        break;
                    case "set":
                        if (length == 0) return player.sendMsg("§c你还没有信任名单");
                        editPermsForm(player);
                        break;
                    case "list":
                        if (length == 0) return player.sendMsg("§c你还没有信任名单");
                        getPermsList(player);
                        break;
                }
            }
        ]

    )

    cmd.setEnum("perms", ["perms"])

    cmd.setEnum("permskey", ["add", "remove", "set", "list"])


    cmd.mandatory("perms", ParamType.Enum, "perms", 1)

    cmd.mandatory("permskey", ParamType.Enum, "permskey", 1)


    cmd.overload(["perms", "permskey"])


})


skyblock.__i18n.translations["island.help"] += "/is perms add 添加信任权\n/is perms set 设置信任权限\n/is perms list 查看信任列表\n/is perms remove 删除信任名单\n";
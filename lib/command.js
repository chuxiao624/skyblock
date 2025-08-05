class DelayedRemoval {

    constructor() {

        this.data = {};

    }

    add(key, value, delayInSeconds) {
        this.data[key] = {
            value,
            timeout: setTimeout(() => {
                this.remove(key);
            }, delayInSeconds * 1000)
        };
    }


    remove(key) {
        if (this.data[key]) {
            clearInterval(this.data[key].timeout);
            delete this.data[key];
        }
    }


    hasKey(key) {
        return this.data.hasOwnProperty(key);
    }


    get(key) {
        return this.data[key] ? this.data[key].value : undefined;
    }
}


const delayedRemoval = new DelayedRemoval();


// 注册

// 创建岛屿指令
function createCommand(context) {

    let player = context._ori.player;

    if (player.islandID != null) return context.out.error(skyblock.__i18n.tr("error.island.already_exist"))

    let fm = mc.newSimpleForm().setTitle(skyblock.__i18n.tr("form.create.title"));

    let blueprints = skyblock.config.get("blueprint");

    blueprints.forEach((value) => {

        fm.addButton(`${value.name} \n ${value.description}`)

    })

    player.sendForm(fm, (player, id) => {

        if (id == null) return;

        skyblock.Locator.createIsland(player, blueprints[id])

    })
}


// 删除岛屿指令
function deleteCommand(context) {

    let player = context._ori.player;

    if (player.xuid != player.skyblock?.xuid) return context.out.error(skyblock.__i18n.tr("error.island.not_owner"))

    let reset = player.skyblock.reset;

    if (reset >= skyblock.config.get("base").reset_limit) return context.out.error(skyblock.__i18n.tr("error.island.reset_limit"))


    if (delayedRemoval.hasKey(player.xuid)) {

        player.teleport(...skyblock.config.get("base").respawn);

        skyblock.Locator.deleteIsland(player)

        delayedRemoval.remove(player.xuid)

        player.sendMsg(skyblock.__i18n.tr("form.delete.success"))

        player.setRespawnPosition(...skyblock.config.get("base").respawn)

        return false;

    }

    player.sendMsg(skyblock.__i18n.tr("form.delete.description"))

    delayedRemoval.add(player.xuid, player.islandID, 30);
}



// 岛屿设置指令
function setCommand(context) {

    let player = context._ori.player;

    let id = player.islandID

    switch (context.res.operate) {

        case "spawn":

            if (player.inIsland == id) {

                const { pos: { x, y, z, dimid }, xuid, islandID } = player;

                const spawn = player.skyblock.spawn;

                spawn[xuid] = [
                    Math.floor(x),
                    Math.floor(y),
                    Math.floor(z),
                    Math.floor(dimid)
                ];

                player.setRespawnPosition(new IntPos(Math.floor(x), Math.floor(y), Math.floor(z), Math.floor(dimid)))

                skyblock.Locator.setIslandData(islandID, "spawn", spawn);

                player.sendMsg(skyblock.__i18n.tr("form.set.spawn.success"))

                return true;

            }

            context.out.error(skyblock.__i18n.tr("error.island.not_in_island"))

            break;

        case "perms":

            if (id == null) return context.out.error(skyblock.__i18n.tr("error.island.not_exist"))

            let perms = skyblock.Perms.getPermissionList(id)

            let permsKeys = Object.keys(perms)

            let events = skyblock.Perms.getPermission(id).events

            let eventsKeys = Object.keys(events);

            let fm = mc.newCustomForm().setTitle(skyblock.__i18n.tr("form.set.perms.title"))

            fm.addLabel(skyblock.__i18n.tr("form.set.events.description"))

            eventsKeys.forEach(key => {

                fm.addSwitch(skyblock.__i18n.tr(`events.${key}`), events[key])

            })

            fm.addLabel(skyblock.__i18n.tr("form.set.perms.description"))

            permsKeys.forEach(key => {

                fm.addSwitch(skyblock.__i18n.tr(`permission.${key}`), perms[key])

            })

            player.sendForm(fm, (player, data) => {

                if (data == null) return;

                let obj_event = {}

                eventsKeys.forEach((key, index) => obj_event[key] = data[index + 1]);

                skyblock.Perms.setPermission(id, false, obj_event, "events");

                let obj = {}

                permsKeys.forEach((key, index) => obj[key] = data[index + 1 + eventsKeys.length + 1]);

                skyblock.Perms.setPermission(id, true, obj);

                player.sendMsg(skyblock.__i18n.tr("form.set.perms.success"));

            })

            break;

        default:

            break;
    }
}


// 邀请指令
function inviteCommand(context) {

    let player = context._ori.player

    if (["accept", "refuse"].includes(context.res.invite_cmd)) {

        if (delayedRemoval.hasKey(player.xuid)) {

            let { xuid, id } = delayedRemoval.get(player.xuid);

            let obj = {

                accept: () => {

                    skyblock.Locator.addMember(player, id)

                    player.sendMsg(skyblock.__i18n.tr("form.invite.accept_success"))

                    mc.getPlayer(xuid)?.sendMsg(skyblock.__i18n.tr("form.invite.accept"))

                },
                refuse: () => {

                    player.sendMsg(skyblock.__i18n.tr("form.invite.refuse_success"))

                    mc.getPlayer(xuid)?.sendMsg(skyblock.__i18n.tr("form.invite.refuse"))

                }
            }

            obj[context.res.invite_cmd]()

            delayedRemoval.remove(player.xuid)

        } else {

            player.sendMsg(skyblock.__i18n.tr("form.invite.not_receive"))

        }

        return;
    }


    if (player.skyblockMembers.length >= skyblock.config.get("base").max_members) return context.out.error(skyblock.__i18n.tr("error.island.max_members"))

    if (player.islandID == null) return context.out.error(skyblock.__i18n.tr("error.island.not_exist"))

    let invitedPlayer = mc.getPlayer(context.res.invite_cmd)

    if (invitedPlayer == null) return context.out.error(skyblock.__i18n.tr("error.player.not_exist"))


    invitedPlayer.sendMsg(skyblock.__i18n.tr("form.invite.description", { player: player.realName }))

    delayedRemoval.add(invitedPlayer.xuid, {
        xuid: player.xuid,
        id: player.islandID
    }, 30);

    player.sendMsg(skyblock.__i18n.tr("form.invite.send_success"))


}






skyblock.Event.listen("onRegisterCommand", (Enum, cmd, map) => {

    ["create", "delete", "spawn"].forEach((key) => Enum.push(key))

    map.push(
        [
            (context) => context.res.action == "create",
            (context) => createCommand(context)
        ],
        [
            (context) => context.res.action == "delete",
            (context) => deleteCommand(context)
        ],
        [
            (context) => context.res.action == "spawn",
            (context) => {

                let player = context._ori.player;

                if (player.islandID == null) return context.out.error(skyblock.__i18n.tr("error.island.not_exist"))

                player.teleport(...player.skyblockSpawn)

            }
        ],
        [
            (context) => context.res.key == "set",
            (context) => setCommand(context)
        ],
        [
            (context) => context.res.key2 == "invite",
            (context) => inviteCommand(context)
        ],
        [
            (context) => context.res.key3 == "kick",
            (context) => {

                let player = context._ori.player;

                if (!player.isIslandOwner) return context.out.error(skyblock.__i18n.tr("error.island.not_owner"))

                if (player.skyblockMembers.includes(data.name2xuid(context.res.key3name))) {

                    skyblock.Locator.removeMember(player.islandID, context.res.key3name)

                    player.sendMsg(skyblock.__i18n.tr("form.kick.success", { player: context.res.key3name }))

                } else {

                    context.out.error(skyblock.__i18n.tr("error.player.not_exist"))

                }

            }
        ],
        [
            (context) => context.res.help == "help",
            (context) => {

                let player = context._ori.player;

                player.tell(skyblock.__i18n.tr("island.help"))

            }
        ],
        [
            (context) => context.res.setworld == "setworld",
            (context) => {

                let player = context._ori.player;

                if (!player.isOP()) return context.out.error(skyblock.__i18n.tr("error.island.no_permission"))

                let perms = skyblock.config.get("worldPermission")

                let permsKeys = Object.keys(perms)

                let events = skyblock.config.get("worldEvent")

                let eventsKeys = Object.keys(events);

                let fm = mc.newCustomForm().setTitle(skyblock.__i18n.tr("form.set.perms.title"))

                fm.addLabel(skyblock.__i18n.tr("form.set.events.description"))

                eventsKeys.forEach(key => {

                    fm.addSwitch(skyblock.__i18n.tr(`events.${key}`), events[key])

                })

                fm.addLabel(skyblock.__i18n.tr("form.set.perms.description"))

                permsKeys.forEach(key => {

                    fm.addSwitch(skyblock.__i18n.tr(`permission.${key}`), perms[key])

                })

                player.sendForm(fm, (player, data) => {

                    if (data == null) return;

                    let obj_event = {}

                    eventsKeys.forEach((key, index) => obj_event[key] = data[index + 1]);

                    skyblock.config.set("worldEvent", obj_event);

                    let obj = {}

                    permsKeys.forEach((key, index) => obj[key] = data[index + 1 + eventsKeys.length + 1]);

                    skyblock.config.set("worldPermission", obj);

                    player.sendMsg(skyblock.__i18n.tr("form.set.perms.success"));

                })

            }
        ]

    )

    cmd.setEnum("key", ["set"])

    cmd.setEnum("setworld", ["setworld"])

    cmd.setEnum("help", ["help"])

    cmd.setEnum("operate", ["spawn", "perms"])

    cmd.setEnum("key2", ["invite"]);

    cmd.setEnum("key3", ["kick"]);

    cmd.setEnum("key2Enum", ["accept", "refuse"]);

    cmd.mandatory("setworld", ParamType.Enum, "setworld", 1);

    cmd.mandatory("key", ParamType.Enum, "key", 1);

    cmd.mandatory("help", ParamType.Enum, "help", 1);

    cmd.mandatory("operate", ParamType.Enum, "operate", 1);

    cmd.mandatory("key2", ParamType.Enum, "key2", 1);

    cmd.mandatory("key2operate", ParamType.Enum, "key2Enum", 1);

    cmd.mandatory("invite_cmd", ParamType.RawText);

    cmd.mandatory("key3", ParamType.Enum, "key3", 1);

    cmd.mandatory("key3name", ParamType.RawText);

    cmd.overload(["help"]);

    cmd.overload(["setworld"]);

    cmd.overload(["key", "operate"]);

    cmd.overload(["key2", "key2operate"]);

    cmd.overload(["key2", "invite_cmd"]);

    cmd.overload(["key3", "key3name"]);

})


const cmd = mc.newCommand("island", "空岛", PermType.Any);

cmd.setAlias("is");

let Enum = [];

let map = [];

skyblock.Event.$emit("onRegisterCommand", [Enum, cmd, map]);

cmd.setEnum("ActionEnum", Enum);
cmd.mandatory("action", ParamType.Enum, "ActionEnum", 1);

cmd.overload([]);
cmd.overload(["ActionEnum"]);

cmd.setCallback((_cmd, _ori, out, res) => {

    log("Enum array:", Enum);
    log("res object:", JSON.stringify(res));

    const context = { _cmd, _ori, out, res }

    const target = map.find((m) => m[0](context));

    if (target) {

        target[1](context);

        return
    }


    if (_ori.player.islandID == null) {

        _ori.player.runcmd("is create")

        return false;

    }

    skyblock.Event.$emit("onExecuteSkyCommandIs", [context]);

});

cmd.setup();


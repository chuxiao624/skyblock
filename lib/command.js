/**
 * 延迟移除管理器
 * 用于管理需要延迟删除的数据，如邀请信息、删除确认等
 */
class DelayedRemoval {
    constructor() {
        this.data = {};  // 存储待删除的数据
    }

    /**
     * 添加一个延迟移除项
     * @param {string} key - 唯一标识符
     * @param {any} value - 要存储的值
     * @param {number} delayInSeconds - 延迟删除的秒数
     */
    add(key, value, delayInSeconds) {
        this.data[key] = {
            value,
            timeout: setTimeout(() => this.remove(key), delayInSeconds * 1000)
        };
    }

    /**
     * 移除指定的延迟项
     * @param {string} key - 要移除的项的标识符
     */
    remove(key) {
        if (this.data[key]) {
            clearInterval(this.data[key].timeout);
            delete this.data[key];
        }
    }

    /**
     * 检查是否存在指定的key
     * @param {string} key - 要检查的key
     * @returns {boolean} 是否存在
     */
    hasKey(key) {
        return key in this.data;
    }

    /**
     * 获取指定key的值
     * @param {string} key - 要获取值的key
     * @returns {any} 存储的值，如果不存在则返回undefined
     */
    get(key) {
        return this.data[key]?.value;
    }
}

/**
 * 命令处理器类
 * 提供命令处理过程中需要的通用功能和验证方法
 */
class CommandHandler {
    constructor() {
        this.delayedRemoval = new DelayedRemoval();
    }

    /**
     * 验证玩家是否有效
     * @param {Player} player - 要验证的玩家
     * @returns {boolean} 玩家是否有效
     */
    validatePlayer(player) {
        return player != null;
    }

    /**
     * 验证玩家是否为岛屿所有者
     * @param {Player} player - 要验证的玩家
     * @returns {boolean} 是否为岛屿所有者
     */
    validateIslandOwner(player) {
        return player.xuid === player.skyblock?.xuid;
    }

    createPermissionForm(title, events, permissions) {
        const form = mc.newCustomForm().setTitle(title);

        form.addLabel(skyblock.__i18n.tr("form.set.events.description"));
        Object.keys(events).forEach(key => {
            form.addSwitch(skyblock.__i18n.tr(`events.${key}`), events[key]);
        });

        form.addLabel(skyblock.__i18n.tr("form.set.perms.description"));
        Object.keys(permissions).forEach(key => {
            form.addSwitch(skyblock.__i18n.tr(`permission.${key}`), permissions[key]);
        });

        return form;
    }

    handlePermissionFormData(data, eventsKeys, permsKeys, isWorldLevel = false) {
        if (data == null) return null;

        const eventObj = {};
        eventsKeys.forEach((key, index) => {
            eventObj[key] = data[index + 1];
        });

        const permObj = {};
        permsKeys.forEach((key, index) => {
            permObj[key] = data[index + 1 + eventsKeys.length + 1];
        });

        return { events: eventObj, permissions: permObj };
    }
}


// 创建命令处理器实例

const commandHandler = new CommandHandler();


/**
 * 空岛命令处理函数集合
 * 包含所有岛屿相关的命令处理逻辑
 */
class Commands {
    /**
     * 处理创建岛屿命令
     * /is create - 创建新的岛屿
     */

    constructor() {
        // 自动绑定所有方法到 this
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
            const val = this[key];
            if (key !== 'constructor' && typeof val === 'function') {
                this[key] = val.bind(this);
            }
        }
    }

    create(context) {
        const player = context._ori.player;

        // 检查玩家是否已有岛屿
        if (player.islandID != null) {
            return context.out.error(skyblock.__i18n.tr("error.island.already_exist"));
        }

        // 创建岛屿选择表单
        const form = mc.newSimpleForm().setTitle(skyblock.__i18n.tr("form.create.title"));
        const blueprints = skyblock.config.get("blueprint");

        // 添加所有可用的岛屿模板
        blueprints.forEach(blueprint => {
            form.addButton(`${blueprint.name}\n${blueprint.description}`);
        });

        // 处理玩家选择
        player.sendForm(form, (player, id) => {
            if (id != null) {
                skyblock.Locator.createIsland(player, blueprints[id]);
            }
        });
    }


    /**
     * 处理删除岛屿命令
     * /is delete - 删除当前岛屿（需要二次确认）
     */
    delete(context) {
        const player = context._ori.player;

        // 验证玩家是否为岛屿所有者
        if (!commandHandler.validateIslandOwner(player)) {
            return context.out.error(skyblock.__i18n.tr("error.island.not_owner"));
        }

        const resetCount = player.skyblock.reset;
        const resetLimit = skyblock.config.get("base").reset_limit;

        // 检查重置次数限制
        if (resetCount >= resetLimit) {
            return context.out.error(skyblock.__i18n.tr("error.island.reset_limit"));
        }

        // 如果已经确认删除，执行删除操作
        if (commandHandler.delayedRemoval.hasKey(player.xuid)) {
            const respawnPos = skyblock.config.get("base").respawn;

            player.teleport(...respawnPos);
            skyblock.Locator.deleteIsland(player);
            commandHandler.delayedRemoval.remove(player.xuid);
            player.sendMsg(skyblock.__i18n.tr("form.delete.success"));
            player.setRespawnPosition(...respawnPos);

            return false;
        }

        // 第一次使用删除命令，发送确认提示
        player.sendMsg(skyblock.__i18n.tr("form.delete.description"));
        commandHandler.delayedRemoval.add(player.xuid, player.islandID, 30);
    }



    set(context) {
        const player = context._ori.player;
        const islandId = player.islandID;

        switch (context.res.operate_param) {
            case "spawn":
                return this.handleSetSpawn(context, player, islandId);
            case "perms":
                return this.handleSetPermissions(context, player, islandId);
            default:
                break;
        }
    }

    handleSetSpawn(context, player, islandId) {
        if (player.inIsland !== islandId) {
            return context.out.error(skyblock.__i18n.tr("error.island.not_in_island"));
        }

        const { pos: { x, y, z, dimid }, xuid } = player;
        const floorPos = [Math.floor(x), Math.floor(y), Math.floor(z), Math.floor(dimid)];

        const spawn = player.skyblock.spawn;
        spawn[xuid] = floorPos;

        player.setRespawnPosition(new IntPos(...floorPos));
        skyblock.Locator.setIslandData(islandId, "spawn", spawn);
        player.sendMsg(skyblock.__i18n.tr("form.set.spawn.success"));

        return true;
    }

    handleSetPermissions(context, player, islandId) {
        if (islandId == null) {
            return context.out.error(skyblock.__i18n.tr("error.island.not_exist"));
        }

        const permissions = skyblock.Perms.getPermissionList(islandId);
        const events = skyblock.Perms.getPermission(islandId).events;
        const eventsKeys = Object.keys(events);
        const permsKeys = Object.keys(permissions);

        const form = commandHandler.createPermissionForm(
            skyblock.__i18n.tr("form.set.perms.title"),
            events,
            permissions
        );

        player.sendForm(form, (player, data) => {
            const result = commandHandler.handlePermissionFormData(data, eventsKeys, permsKeys);
            if (result) {
                skyblock.Perms.setPermission(islandId, false, result.events, "events");
                skyblock.Perms.setPermission(islandId, true, result.permissions);
                player.sendMsg(skyblock.__i18n.tr("form.set.perms.success"));
            }
        });
    }


    /**
     * 处理岛屿邀请命令
     * /is invite <accept/refuse> - 接受或拒绝邀请
     * /is invite <player> - 邀请玩家加入岛屿
     */
    invite(context) {
        const player = context._ori.player;

        const target = context.res.invite_target;  // 被邀请的玩家名

        if (["accept", "refuse"].includes(target)) {

            return this.handleInviteResponse(player, target);

        }

        this.handleSendInvite(context, player, target)
    }

    /**
     * 处理邀请响应（接受或拒绝）
     * @param {Object} context - 命令上下文
     * @param {Player} player - 响应邀请的玩家
     * @param {string} action - 操作类型："accept" 或 "refuse"
     */
    handleInviteResponse(player, action) {
        // 检查是否有待处理的邀请
        if (!commandHandler.delayedRemoval.hasKey(player.xuid)) {
            return player.sendMsg(skyblock.__i18n.tr("form.invite.not_receive"));
        }

        // 获取邀请数据
        const inviteData = commandHandler.delayedRemoval.get(player.xuid);
        const inviterPlayer = mc.getPlayer(inviteData.xuid);

        // 移除邀请记录（无论接受还是拒绝）
        commandHandler.delayedRemoval.remove(player.xuid);

        if (action === "accept") {
            return this.acceptInvite(player, inviterPlayer, inviteData.id);
        } else if (action === "refuse") {
            return this.refuseInvite(player, inviterPlayer);
        }
    }

    /**
     * 处理接受邀请的逻辑
     * @param {Player} player - 接受邀请的玩家
     * @param {Player} inviterPlayer - 发出邀请的玩家
     * @param {string} inviterIslandId - 邀请者的岛屿ID
     */
    acceptInvite(player, inviterPlayer, inviterIslandId) {
        // 如果玩家已有岛屿，先删除原岛屿
        if (player.islandID != null) {
            skyblock.Locator.deleteIsland(player);
            player.sendMsg(skyblock.__i18n.tr("form.invite.island_deleted"));
        }

        try {
            // 将玩家添加到邀请者的岛屿
            skyblock.Locator.addMember(player, inviterIslandId);

            // 发送成功消息给双方
            player.sendMsg(skyblock.__i18n.tr("form.invite.accept_success"));
            inviterPlayer?.sendMsg(skyblock.__i18n.tr("form.invite.member_joined", {
                player: player.realName
            }));

            // 设置新的重生点
            const respawnPos = skyblock.config.get("base").respawn;
            player.setRespawnPosition(...respawnPos);

        } catch (error) {
            // 处理加入岛屿失败的情况
            player.sendMsg(skyblock.__i18n.tr("form.invite.accept_failed"));
            inviterPlayer?.sendMsg(skyblock.__i18n.tr("form.invite.accept_failed_inviter", {
                player: player.realName
            }));
        }
    }

    /**
     * 处理拒绝邀请的逻辑
     * @param {Player} player - 拒绝邀请的玩家
     * @param {Player} inviterPlayer - 发出邀请的玩家
     */
    refuseInvite(player, inviterPlayer) {
        player.sendMsg(skyblock.__i18n.tr("form.invite.refuse_success"));
        inviterPlayer?.sendMsg(skyblock.__i18n.tr("form.invite.refuse", {
            player: player.realName
        }));
    }

    /**
     * 处理发送邀请的逻辑
     * @param {Object} context - 命令上下文
     * @param {Player} player - 发送邀请的玩家（岛主）
     * @param {string} targetPlayerName - 被邀请玩家的名称
     */
    handleSendInvite(context, player, targetPlayerName) {

        log(123)

        // 检查玩家是否拥有岛屿
        if (player.islandID == null) {
            return context.out.error(skyblock.__i18n.tr("error.island.not_exist"));
        }

        // 检查玩家是否为岛屿所有者
        if (!commandHandler.validateIslandOwner(player)) {
            return context.out.error(skyblock.__i18n.tr("error.island.not_owner"));
        }

        // 检查岛屿成员数是否已达上限
        const maxMembers = skyblock.config.get("base").max_members;
        if (player.skyblockMembers.length >= maxMembers) {
            return context.out.error(skyblock.__i18n.tr("error.island.max_members"));
        }

        // 查找被邀请的玩家
        const invitedPlayer = mc.getPlayer(targetPlayerName);
        if (invitedPlayer == null) {
            return context.out.error(skyblock.__i18n.tr("error.player.not_exist"));
        }

        // 检查是否尝试邀请自己
        // if (invitedPlayer.xuid === player.xuid) {
        //     return context.out.error(skyblock.__i18n.tr("error.invite.self"));
        // }

        // 检查被邀请玩家是否已是岛屿成员
        if (player.skyblockMembers.includes(invitedPlayer.xuid)) {
            return context.out.error(skyblock.__i18n.tr("error.invite.already_member"));
        }

        // 检查该玩家是否已有待处理的邀请
        if (commandHandler.delayedRemoval.hasKey(invitedPlayer.xuid)) {
            return context.out.error(skyblock.__i18n.tr("error.invite.already_invited"));
        }

        // 向被邀请玩家发送邀请信息
        invitedPlayer.sendMsg(skyblock.__i18n.tr("form.invite.description", {
            player: player.realName
        }));
        invitedPlayer.sendMsg(skyblock.__i18n.tr("form.invite.commands"));

        // 存储邀请信息，30秒后自动过期
        commandHandler.delayedRemoval.add(invitedPlayer.xuid, {
            xuid: player.xuid,        // 邀请者的XUID
            id: player.islandID       // 邀请者的岛屿ID
        }, 30);

        // 向邀请者发送成功消息
        player.sendMsg(skyblock.__i18n.tr("form.invite.send_success", {
            player: invitedPlayer.realName
        }));
    }

    spawn(context) {
        const player = context._ori.player;

        if (player.islandID == null) {
            return context.out.error(skyblock.__i18n.tr("error.island.not_exist"));
        }

        player.teleport(...player.skyblockSpawn);
    }

    kick(context) {
        const player = context._ori.player;

        if (!player.isIslandOwner) {
            return context.out.error(skyblock.__i18n.tr("error.island.not_owner"));
        }

        const targetName = context.res.kick_target;
        const targetXuid = data.name2xuid(targetName);

        if (player.skyblockMembers.includes(targetXuid)) {
            skyblock.Locator.removeMember(player.islandID, targetName);
            player.sendMsg(skyblock.__i18n.tr("form.kick.success", { player: targetName }));
        } else {
            context.out.error(skyblock.__i18n.tr("error.player.not_exist"));
        }
    }

    help(context) {
        const player = context._ori.player;
        player.tell(skyblock.__i18n.tr("island.help"));
    }

    setworld(context) {
        const player = context._ori.player;

        if (!player.isOP()) {
            return context.out.error(skyblock.__i18n.tr("error.island.no_permission"));
        }

        const permissions = skyblock.config.get("worldPermission");
        const events = skyblock.config.get("worldEvent");
        const eventsKeys = Object.keys(events);
        const permsKeys = Object.keys(permissions);

        const form = commandHandler.createPermissionForm(
            skyblock.__i18n.tr("form.set.perms.title"),
            events,
            permissions
        );

        player.sendForm(form, (player, data) => {
            const result = commandHandler.handlePermissionFormData(data, eventsKeys, permsKeys, true);
            if (result) {
                skyblock.config.set("worldEvent", result.events);
                skyblock.config.set("worldPermission", result.permissions);
                player.sendMsg(skyblock.__i18n.tr("form.set.perms.success"));
            }
        });
    }
};



const regCommands = new Commands();


skyblock.Event.listen("onRegisterCommand", (Enum, cmd, map) => {

    ["create", "delete", "spawn"].forEach((key) => Enum.push(key))

    map.push(
        [
            (context) => context.res.action === "create",
            regCommands.create
        ],
        [
            (context) => context.res.action === "delete",
            regCommands.delete
        ],
        [
            (context) => context.res.action === "spawn",
            regCommands.spawn
        ],
        [
            (context) => context.res.set_param === "set",
            regCommands.set
        ],
        [
            (context) => context.res.invite_param === "invite",
            regCommands.invite
        ],
        [
            (context) => context.res.kick_param === "kick",
            regCommands.kick
        ],
        [
            (context) => context.res.help_param === "help",
            regCommands.help
        ],
        [
            (context) => context.res.setworld_param === "setworld",
            regCommands.setworld
        ]
    );

    cmd.setEnum("SetEnum", ["set"])

    cmd.setEnum("SetworldEnum", ["setworld"])

    cmd.setEnum("HelpEnum", ["help"])

    cmd.setEnum("OperateEnum", ["spawn", "perms"])

    cmd.setEnum("InviteEnum", ["invite"]);

    cmd.setEnum("KickEnum", ["kick"]);

    cmd.setEnum("InviteActionEnum", ["accept", "refuse"]);

    cmd.mandatory("setworld_param", ParamType.Enum, "SetworldEnum", 1);

    cmd.mandatory("set_param", ParamType.Enum, "SetEnum", 1);

    cmd.mandatory("help_param", ParamType.Enum, "HelpEnum", 1);

    cmd.mandatory("operate_param", ParamType.Enum, "OperateEnum", 1);

    cmd.mandatory("invite_param", ParamType.Enum, "InviteEnum", 1);

    cmd.mandatory("invite_action_param", ParamType.Enum, "InviteActionEnum", 1);

    cmd.mandatory("invite_target", ParamType.RawText);

    cmd.mandatory("kick_param", ParamType.Enum, "KickEnum", 1);

    cmd.mandatory("kick_target", ParamType.RawText);

    cmd.overload(["HelpEnum"]);

    cmd.overload(["SetworldEnum"]);

    cmd.overload(["SetEnum", "OperateEnum"]);

    cmd.overload(["InviteEnum", "InviteActionEnum"]);

    cmd.overload(["InviteEnum", "invite_target"]);

    cmd.overload(["KickEnum", "kick_target"]);

})


const cmd = mc.newCommand("island", "空岛", PermType.Any);

cmd.setAlias("is");

const commandEnum = [];
const commandMap = [];

skyblock.Event.$emit("onRegisterCommand", [commandEnum, cmd, commandMap]);

cmd.setEnum("ActionEnum", commandEnum);
cmd.mandatory("action", ParamType.Enum, "ActionEnum", 1);

cmd.overload([]);
cmd.overload(["ActionEnum"]);

cmd.setCallback((_cmd, _ori, out, res) => {
    const context = { _cmd, _ori, out, res };
    const targetCommand = commandMap.find((command) => command[0](context));

    if (targetCommand) {
        targetCommand[1](context);
        return;
    }

    if (_ori.player.islandID == null) {
        _ori.player.runcmd("is create");
        return false;
    }

    skyblock.Event.$emit("onExecuteSkyCommandIs", [context]);

});

cmd.setup();


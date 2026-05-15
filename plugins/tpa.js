// TPA 请求表 { [targetXuid]: requesterXuid }
const tpaRequests = {};

const setTpaRequest = (targetXuid, requesterXuid) => {
    tpaRequests[targetXuid] = requesterXuid;
    skyblock.Timer.delay(`tpa:expire:${targetXuid}`, () => delete tpaRequests[targetXuid], 30000);
};

const clearTpaRequest = (targetXuid) => {
    delete tpaRequests[targetXuid];
    skyblock.Timer.cancel(`tpa:expire:${targetXuid}`);
};

const acceptTpa = (target) => {
    const requesterXuid = tpaRequests[target.xuid];
    if (!requesterXuid) return target.tell("§c你没有收到传送请求");

    clearTpaRequest(target.xuid);

    const requester = mc.getPlayer(requesterXuid);
    if (!requester) return target.tell("§c请求方已离线");

    requester.teleport(target.pos);
    target.tell(`§a已接受 §e${requester.realName} §a的传送请求`);
    requester.tell("§a传送成功");
};

const sendTpaRequest = (requester, target) => {
    setTpaRequest(target.xuid, requester.xuid);

    target.sendModalForm(
        "传送请求",
        `§a玩家 §e${requester.realName} §a请求传送到你的位置`,
        "接受", "拒绝",
        (target, accepted) => {
            if (accepted == null || !tpaRequests[target.xuid]) return;
            if (!accepted) {
                clearTpaRequest(target.xuid);
                return requester.tell("§c对方拒绝了你的请求");
            }
            acceptTpa(target);
        }
    );

    target.tell(`§e${requester.realName} §a请求传送到你的位置，输入 /tpa ok 接受`);
};

// 选人界面
const openTpaMenu = (requester) => {
    const candidates = mc.getOnlinePlayers().filter(p => p.xuid !== requester.xuid);
    if (candidates.length === 0) return requester.tell("§c当前没有其他在线玩家");

    requester.sendSimpleForm(
        "选择传送目标", "",
        candidates.map(p => p.realName),
        candidates.map(() => "textures/items/skull_steve"),
        (_, id) => id != null && sendTpaRequest(requester, candidates[id])
    );
};

// 命令注册
const cmd_tpa = mc.newCommand("tpa", "传送请求", PermType.Any);
cmd_tpa.setEnum("action", ["ok", "gui"]);
cmd_tpa.mandatory("action", ParamType.Enum, "action", 1);
cmd_tpa.overload(["action"]);

cmd_tpa.setCallback((_, origin, __, res) => {
    const player = origin.player;
    if (!player) return;

    if (res.action === "ok") acceptTpa(player);
    else if (res.action === "gui") openTpaMenu(player);
});

cmd_tpa.setup();
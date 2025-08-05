
const level_flie = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\level\\config.json', '{}');

const level_data_file = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\level\\data\\data.json', '{}');

const block_value_file = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\level\\data\\block_value.json', '{}');

let block_value = JSON.parse(block_value_file.read());

level_flie.init("delay", 50);

level_flie.init("interval", 5);

let level_data = level_data_file.init("data", {});



skyblock.Locator.getPlayerLevel = function (player) {

    return level_data[player.islandID]

}


class ExpiringCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, timeout) {
        if (this.cache.has(key)) {
            clearInterval(this.cache.get(key).timeoutId);
        }

        const timeoutId = setTimeout(() => {
            this.cache.delete(key);
        }, timeout * 1000);

        this.cache.set(key, { value, timeoutId });
    }

    get(key) {
        return this.cache.has(key) ? this.cache.get(key).value : null;
    }

    has(key) {
        return this.cache.has(key);
    }

    delete(key) {
        if (this.cache.has(key)) {
            clearInterval(this.cache.get(key).timeoutId);
            this.cache.delete(key);
        }
    }
}

const cache = new ExpiringCache();

function getStructureData(start, end, height) {

    let intPos = {
        start: new IntPos(start[0], height, start[1], 0),
        end: new IntPos(end[0], height, end[1], 0)
    }

    let structureData = JSON.parse(mc.getStructure(intPos.start, intPos.end, false, false).toString())

    let block_indices = structureData["structure"]["block_indices"][0]

    let block_palette = structureData["structure"]["palette"]["default"]["block_palette"]

    let level = 0


    for (let key of block_indices) {

        if (block_value.hasOwnProperty(block_palette[key].name)) {

            level += block_value[block_palette[key].name]
        }
    }

    return level
}


function calculatePlayerLevel(player) {

    let id = player.islandID;

    if (id == null) return player.sendMsg("你还没有岛屿")

    if (id != player.inIsland) return player.sendMsg("你必须在自己的岛屿上")

    if (cache.has(player.xuid)) return player.sendMsg("正在计算你的岛屿等级 , 请勿频繁操作!")


    let nowTime = new Date().getTime()

    if (level_data[id]?.["interval"] != null && (nowTime - level_data[id]["interval"]) / 60000 < level_flie.get("interval")) {

        return player.sendMsg("岛屿等级查询冷却中...")

    }


    player.sendMsg("开始计算岛屿等级...")

    cache.set(player.xuid, true, 60);

    let start = player.skyblock.range[0];
    let end = player.skyblock.range[1];
    let level = 0;
    let k = -64;

    function calculateNextLayer() {
        if (k > 320) {

            let levels = parseInt(level / 100);

            player.sendMsg(`计算完成 你的岛屿等级为: ${levels}`);

            level_data[player.islandID] = {
                level: levels,
                interval: new Date().getTime(),
                members: player.skyblockMembers,
                owner: player.xuid,
            };

            cache.delete(player.xuid);

            level_data_file.set("data", level_data);

            return;
        }

        level += getStructureData(start, end, k);

        k++;

        setTimeout(calculateNextLayer, level_flie.get("delay"));
    }

    calculateNextLayer();
}


function getIslandLevelTop(player) {

    let str = "岛屿等级排行 : \n"

    let sortedKeys = Object.keys(level_data).sort((a, b) => level_data[b].level - level_data[a].level);

    sortedKeys.forEach((key, index) => {

        let obj = level_data[key];

        let member = data.xuid2name(obj.owner)

        obj.members.forEach((item) => member += ` ${data.xuid2name(item)}`)

        str += `§3#${index + 1}§r [§a${level_data[key].level}§r] (§e${member}§r)\n`

    })

    player.tell(str);

    return str;

}



function getBlockValue(player, item) {

    let value = block_value.hasOwnProperty(item)

    player.sendMsg(value ? block_value[item] : "一文不值")

}


function setBlockValue(player, item) {

    if (!player.isOP()) return player.sendMsg("你没有权限")



    if (item == null) return player.sendMsg("你没有拿到任何物品");

    let fm = mc.newCustomForm().setTitle("设置方块价值")

    fm.addInput("输入方块价值")

    player.sendForm(fm, (player, dt) => {

        if (dt == null) return;

        let price = Number(dt[0]);

        if (!price) return player.sendMsg("请正确输入");

        block_value[item] = price

        player.sendMsg("设置成功")

        block_value_file.write(JSON.stringify(block_value))

    })


}


skyblock.Event.listen("onRegisterCommand", (Enum, cmd, map) => {

    map.push(

        [
            (context) => context.res.level == "level",
            (context) => {
                let player = context._ori.player;

                switch (context.res.leveloper) {

                    case "get":
                        calculatePlayerLevel(player);
                        break;
                    case "setvalue":
                        setBlockValue(player, player.getHand().type);
                        break;
                    case "getvalue":
                        getBlockValue(player, player.getHand().type);
                        break;
                    case "top":
                        getIslandLevelTop(player);
                        break;
                    default:
                        break;
                }
            }
        ]

    )

    cmd.setEnum("level", ["level"])

    cmd.setEnum("leveloper", ["get", "setvalue", "getvalue", "top"])


    cmd.mandatory("level", ParamType.Enum, "level", 1)

    cmd.mandatory("leveloper", ParamType.Enum, "leveloper", 1)


    cmd.overload(["level", "leveloper"])


})

function GetPlayerLevel(xuid) {

    let id = mc.getPlayer(xuid).islandID;

    return level_data[id] ? level_data[id].level : 0

}

ll.exports(GetPlayerLevel, "level", "GetPlayerLevel");

skyblock.__i18n.translations["island.help"] += "/is level get 计算岛屿等级\n/is level setvalue 设置方块价值\n/is level getvalue 获取方块价值\n/is level top 岛屿等级排行\n"


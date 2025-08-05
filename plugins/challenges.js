
class Challenges {

    constructor() {

        this.data_file = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\challenges\\data\\data.json', '{}')

        this.player_file = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\challenges\\data\\player.json', '{}')

        this.pl_data = this.player_file.init("data", {})

        this.levels = this.data_file.init("levels", ["新手", "基础", "简单", "普通", "困难"]);

        this.levelsLocked = this.data_file.init("levelsLocked", {
            "新手": "新手=0",
            "基础": "新手=5",
            "简单": "基础=6",
            "普通": "简单=6",
            "困难": "普通=6"
        });

        this.challengeList = this.data_file.init("challengeList", {

            Fourpiecesofwood: {
                name: "要想富! 先..?",
                description: "树是人类的好朋友,去砍四个木头吧",
                type: "inventory",
                level: "新手",
                required: ["minecraft:oak_log=4"],
                rewardType: "nbt",
                rewardText: "四个树苗",
                rewardList: ["橡木树苗=4"],
                maxtimes: 1
            },
            TheBeginningofEverything: {
                name: "一切的开始",
                description: "在你的岛屿放置一个工作台",
                type: "block",
                level: "新手",
                required: ["minecraft:crafting_table"],
                rewardType: "item",
                rewardText: "一个泥土",
                rewardList: ["minecraft:dirt=3"],
                maxtimes: 1
            },
            unlimitedResources: {
                name: "无限的资源",
                description: "你要知道,刷石机能给你带来巨大的财富!",
                type: "block",
                level: "新手",
                required: ["minecraft:water", "minecraft:lava"],
                rewardType: "item",
                rewardText: "4个砂砾",
                rewardList: ["minecraft:gravel=4"],
                maxtimes: 1
            },
            Thepickaxeisinhand: {
                name: "镐子在手",
                description: "制作一个石镐",
                type: "inventory",
                level: "新手",
                required: ["minecraft:stone_pickaxe=1"],
                rewardType: "item",
                rewardText: "一把铁镐",
                rewardList: ["minecraft:iron_pickaxe=1"],
                maxtimes: 1
            },
            Goodhabits: {
                name: "好的习惯",
                description: "在你的岛屿种一棵树",
                type: "block",
                level: "新手",
                required: ["minecraft:sapling"],
                rewardType: "mixed",
                rewardText: "无尽的开采 , 一味的索取 ,只会带来灭亡! 奖励四种常见的树苗, 会有什么呢",
                rewardList: [
                    {
                        rewardType: "item",
                        rewardList: ["minecraft:cherry_sapling=1"]
                    },
                    {
                        rewardType: "nbt",
                        rewardList: ["橡木树苗=1", "桦树树苗=1", "金合欢树苗=1"]
                    }
                ],
                maxtimes: 1
            },
            Crazycollection: {
                name: "疯狂采集",
                description: "收集64个圆石",
                type: "inventory",
                level: "新手",
                required: ["minecraft:cobblestone=64"],
                rewardType: "item",
                rewardText: "四个铁矿石, 四个煤炭,四个沙子",
                rewardList: ["minecraft:iron_ore=4", "minecraft:coal=4", "minecraft:sand=4"],
                maxtimes: 1
            },
            PlacingBoxes: {
                name: "存储物资",
                description: "在你的岛屿放置一个箱子",
                type: "block",
                level: "新手",
                required: ["minecraft:chest"],
                rewardType: "item",
                rewardText: "三个泥土",
                rewardList: ["minecraft:dirt=3"],
                maxtimes: 1
            },
            Placingthefurnace: {
                name: "制作熔炉",
                description: "在你的岛屿放置一个熔炉",
                type: "block",
                level: "新手",
                required: ["minecraft:furnace"],
                rewardType: "item",
                rewardText: "一个铁矿石",
                rewardList: ["minecraft:iron_ore=1"],
                maxtimes: 1
            },
            charcoal: {
                name: "木炭",
                description: "烧制16个木炭",
                type: "inventory",
                level: "新手",
                required: ["minecraft:charcoal=16"],
                rewardType: "item",
                rewardText: "1个铁矿石",
                rewardList: ["minecraft:iron_ore=1"],
                maxtimes: 1
            },
            Lightingtools: {
                name: "照明工具",
                description: "制作16个火把",
                type: "inventory",
                level: "新手",
                required: ["minecraft:torch=16"],
                rewardType: "item",
                rewardText: "16个煤炭",
                rewardList: ["minecraft:coal=16"],
                maxtimes: 1
            },
            Burntglass: {
                name: "烧制玻璃",
                description: "烧制1个玻璃",
                type: "inventory",
                level: "新手",
                required: ["minecraft:glass=1"],
                rewardType: "item",
                rewardText: "一个铁矿石",
                rewardList: ["minecraft:iron_ore=1"],
                maxtimes: 1
            },
            Islandnewcomers: {
                name: "新的起点",
                description: "岛屿等级达到50级",
                type: "level",
                level: "新手",
                required: 50,
                rewardType: "item",
                rewardText: "草方块X1 可可豆X1",
                rewardList: ["minecraft:grass=1", "minecraft:cocoa_beans=1"],
                maxtimes: 1
            }

        });

        this.challengeMap = new Map();

        this.levels.forEach(lv => this.challengeMap.set(lv, {}));

        Object.keys(this.challengeList).forEach((ch) => {

            let lv = this.challengeList[ch].level

            this.challengeMap.get(lv)[ch] = this.challengeList[ch];

        })

        this.nbtFile = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\challenges\\data\\nbt.json', '{}')

        this.nbtData = this.nbtFile.init("data", {})

    }

    getPlayerItem(player, type, count) {

        const items = player.getInventory().getAllItems();

        const total = items.reduce((accumulator, item) => {

            if (item.type === type) return accumulator + item.count;

            return accumulator;

        }, 0);

        return total >= count;
    }

    hasEnoughItems(player, req, name) {

        let itemList = req.map(item => {

            let [type, count] = item.split("=");

            return { type, count: parseInt(count) };

        });

        for (let item of itemList) {

            if (!challenges.getPlayerItem(player, item.type, item.count)) {

                player.sendMsg(`§c你没有足够的§e${item.type}[${item.count}]`);

                return false;

            }

        }

        let inv = player.getInventory();

        let items = inv.getAllItems();

        for (let reqItem of itemList) {

            let reqCount = reqItem.count;

            for (let i = 0; i < items.length && reqCount > 0; i++) {

                let item = items[i];

                if (item.type === reqItem.type) {

                    if (reqCount < item.count) {

                        inv.removeItem(i, reqCount);

                        reqCount = 0;

                    } else {

                        inv.removeItem(i, item.count);

                        reqCount -= item.count;

                    }
                }
            }
        }

        player.refreshItems();

        mc.broadcast(`§a玩家 §e${player.realName} §c完成了 §a${name}`)

        return true;
    }


    hasSpecifiedBlock(player, req, name) {

        let allBlocks = new Set();

        let centerPoint = player.pos;

        for (let x = centerPoint.x - 3; x <= centerPoint.x + 3; x++) {

            for (let y = centerPoint.y - 3; y <= centerPoint.y + 3; y++) {

                for (let z = centerPoint.z - 3; z <= centerPoint.z + 3; z++) {

                    let blockType = mc.getBlock(x, y, z, 0).type

                    if (req.includes(blockType)) {

                        allBlocks.add(blockType)

                    }

                }

            }

        }

        let result = allBlocks.size == req.length

        if (result) {

            mc.broadcast(`§a玩家 §e${player.realName} §c完成了 §a${name}`)

        } else {

            player.sendMsg(`§c你身边没有指定的方块`)
        }

        return result
    }

    hasSpecifiedEntity(player, req, name) {

        let enSet = new Set(...mc.getAllEntities())

        let foundEntities = new Set();

        const { x: playerX, y: playerY, z: playerZ } = player.pos;

        for (const entity of enSet) {

            if (req.includes(entity.type)) {

                const { x: entityX, y: entityY, z: entityZ } = entity.pos;

                const distance = Math.sqrt(

                    Math.pow(entityX - playerX, 2) +
                    Math.pow(entityY - playerY, 2) +
                    Math.pow(entityZ - playerZ, 2)

                );

                if (distance <= 10) {

                    foundEntities.add(entity);

                }

            }

        }

        let result = foundEntities.size == req

        if (result) {

            mc.broadcast(`§a玩家 §e${player.realName} §c完成了 §a${name}`)

        } else {

            player.sendMsg(`你身边没有足够的实体`)
        }

        return result;

    }

    hasEnoughLevel(player, req, name) {

        let lv = skyblock.Locator.getPlayerLevel(player)?.level ?? 0;

        if (lv < req) {

            player.sendMsg(`你的等级不足 , 当前等级${lv}`)

            return false

        }

        mc.broadcast(`§a玩家 §e${player.realName} §c完成了 §a${name}`)

        return true
    }

    splitNumber(number) {

        if (number <= 64) {

            return [number];

        } else {

            const remainder = number % 64;

            const result = [64, ...this.splitNumber(remainder)];

            return result;
        }
    }

    sendReward(player, rewardType, rewardList) {

        const actions = {

            item: () => {

                for (const reward of rewardList) {

                    const [type, count] = reward.split("=");

                    const list = this.splitNumber(parseInt(count));

                    list.forEach(num => {

                        player.giveItem(mc.newItem(type, num));

                    });
                }

                player.refreshItems();
            },
            money: () => {

                for (const action of rewardList) {

                    if (action.startsWith("money")) {

                        const amount = parseInt(action.split("=")[1]);

                        player.addMoney(amount);

                    } else if (action.startsWith("score")) {

                        const [type, amount] = action.split("=")[1].split(":");

                        player.addScore(type, parseInt(amount));

                    }
                }
            },
            Exp: () => {

                for (const action of rewardList) {

                    if (action.startsWith("addLv")) {

                        const amount = parseInt(action.split("=")[1]);

                        player.addLevel(amount);

                    } else if (action.startsWith("addExp")) {

                        const amount = parseInt(action.split("=")[1]);

                        player.addExperience(amount);

                    }

                }
            },
            nbt: () => {

                for (const action of rewardList) {

                    const [name, amount] = action.split("=");

                    let item = mc.newItem(NBT.parseSNBT(this.nbtData[name]))

                    player.giveItem(item, parseInt(amount));
                }

                player.refreshItems();
            },
            mixed: () => {

                for (const reward of rewardList) {

                    this.sendReward(player, reward.rewardType, reward.rewardList);

                }
            },
        };

        const action = actions[rewardType];

        if (action) {
            action();
        }

    }

    checkChallenges(player, challengesName, fn) {

        if (!Boolean(player.islandID == player.inIsland)) {

            return player.sendMsg("§c你必须在自己的岛屿上");

        }

        let { name, required, maxtimes, rewardType, rewardList, level } = this.challengeList[challengesName];

        let times = this.pl_data[player.xuid][level][challengesName];

        if (times == null) times = 0;

        if (times < maxtimes) {

            if (fn(player, required, name)) {

                if (times == 0) {

                    this.pl_data[player.xuid][level][challengesName] = 1;

                } else {

                    this.pl_data[player.xuid][level][challengesName]++;

                }

                this.sendReward(player, rewardType, rewardList)

                this.player_file.set("data", this.pl_data);
            }

        } else {

            player.sendMsg("§c你已经完成过该任务了");

        }
    }

    submitTask(player, challengesName) {

        switch (this.challengeList[challengesName].type) {

            case "inventory":

                this.checkChallenges(player, challengesName, this.hasEnoughItems)

                break;

            case "block":

                this.checkChallenges(player, challengesName, this.hasSpecifiedBlock)

                break;

            case "entity":

                this.checkChallenges(player, challengesName, this.hasSpecifiedEntity)

                break;
            case "level":

                this.checkChallenges(player, challengesName, this.hasEnoughLevel)

                break;

            default:
                break;
        }


    }


    checkChallengeLevelsReq(player, name) {

        let num = Object.keys(this.pl_data[player.xuid][name]).length

        return num >= parseInt(this.levelsLocked[name].split("=")[1])

    }

    Form(player) {

        if (this.pl_data[player.xuid] == null) {

            this.pl_data[player.xuid] = {};

            this.levels.forEach((item) => {

                this.pl_data[player.xuid][item] = {};

            })


        }

        this.player_file.set("data", this.pl_data)

        let fm = mc.newSimpleForm().setTitle("岛屿任务");

        this.levels.forEach((item) => {

            let str = "§c"

            if (this.checkChallengeLevelsReq(player, item)) {

                str = "§a"

            }

            fm.addButton(`${str}${item}`);

        })

        player.sendForm(fm, (player, id) => {

            if (id == null) return false

            const level = this.levels[id];

            this.challengeForm(player, level)

        })

    }

    challengeForm(player, level) {

        if (!this.checkChallengeLevelsReq(player, level)) return player.sendMsg(`§c你需要完成§e${this.levelsLocked[level].split("=")[1]}§r个§c${this.levelsLocked[level].split("=")[0]}§r等级的任务`);

        let keys = this.challengeMap.get(level);

        let list = Object.keys(keys)

        let fm = mc.newSimpleForm().setTitle("岛屿任务");

        list.forEach((ch) => {

            let str = "§c";

            let pl_times = this.pl_data[player.xuid][level][ch];

            if (pl_times == null || pl_times == 0) pl_times = 0;

            if (pl_times > 0) {
                str = "§a";
            }
            fm.addButton(`${str}${keys[ch].name}`)

        })

        player.sendForm(fm, (player, id) => {

            if (id == null) return false

            let chName = list[id];

            let pl_times = this.pl_data[player.xuid][level][chName];

            if (pl_times == null) pl_times = 0;

            const challenge = this.challengeList[chName];

            player.sendModalForm(challenge.name, `§c描述:§r${challenge.description}\n§c奖励:§a${challenge.rewardText}\n§c等级:§a${challenge.level}\n§c次数:§e${pl_times}§r\\§c${challenge.maxtimes}`, "提交", "返回", (player, result) => {

                if (!result) return this.challengeForm(player, level)

                this.submitTask(player, chName);

            })

        })

    }

}

const challenges = new Challenges();




const chcmd = mc.newCommand("challenges", "岛屿挑战", PermType.Any)

chcmd.setEnum("operate", ["add"])

chcmd.mandatory("operate", ParamType.Enum, "operate", 1);

chcmd.mandatory("name", ParamType.RawText);

chcmd.overload(["operate", "name"])

chcmd.overload([])

chcmd.setCallback((_cmd, _ori, out, res) => {

    if (res.operate == "add" && res.name != '') {

        if (!_ori.player.isOP()) return out.error("§c你没有权限使用该指令");

        let snbt = _ori.player.getHand().getNbt().toSNBT();

        challenges.nbtData[res.name] = snbt;

        challenges.nbtFile.set("data", challenges.nbtData);

        _ori.player.sendMsg(`§anbt物品§e ${res.name} §r§a添加成功`)

        return;

    }

    challenges.Form(_ori.player);



})

chcmd.setup();

skyblock.__i18n.translations["island.help"] += "/is challenges 查看岛屿挑战\n";
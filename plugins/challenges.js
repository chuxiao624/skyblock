
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

        this.challengeList = this.data_file.init("challengeList", {});

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



        let levelsLocks = Object.keys(this.levelsLocked);

        let back = name;

        if (levelsLocks.indexOf(name) > 0) {

            back = levelsLocks[levelsLocks.indexOf(name) - 1]

        }

        let num = Object.keys(this.pl_data[player.xuid][back]).length

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

    challengeForm(player, level,) {

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
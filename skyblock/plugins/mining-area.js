const mining_area = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\mining_area\\data.json', '{}');

let area_data = mining_area.init("data", {});

function toRawPos(pos) {

    return [Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z), pos.dimid];

}


class MiningArea {

    constructor() {

        this.cachePos = {};

    }

    choosePos(player, pos) {

        if (!this.cachePos[player.xuid]) return

        if (this.cachePos[player.xuid]?.length == 1) {

            this.cachePos[player.xuid][1] = toRawPos(pos)

            return player.sendMsg("已选择 B 点")

        }

        this.cachePos[player.xuid] = [];

        this.cachePos[player.xuid][0] = toRawPos(pos);

        player.sendMsg("已选择 A 点")

    }



    addMiningArea(player) {

        let fm = mc.newCustomForm().setTitle("添加矿区")

        fm.addInput("名称")

        player.sendForm(fm, (player, dt) => {

            if (dt == null) return false;

            if (dt[0] == '') return player.sendMsg("§c" + "你没有输入任何内容");

            area_data[dt[0]] = {

                pos: this.cachePos[player.xuid],
                rules: {

                    "minecraft:stone": 100,
                    "minecraft:emerald_ore": 1,
                    "minecraft:iron_ore": 10,
                    "minecraft:diamond_ore": 1

                },
                time: null

            }

            mining_area.set("data", area_data);

            player.sendMsg("save_success")

            delete this.cachePos[player.xuid];

        })


    }


    generateBlock(config) {

        const items = Object.keys(config);

        const probabilities = Object.values(config);

        const totalProbability = probabilities.reduce((sum, probability) => sum + probability, 0);

        const randomValue = Math.random() * totalProbability;


        let cumulativeProbability = 0;

        for (let i = 0; i < items.length; i++) {

            cumulativeProbability += probabilities[i];

            if (randomValue <= cumulativeProbability) {

                return items[i];

            }
        }
    }

    traverseCube(start, end, rules) {
        const [startX, startY, startZ] = start;
        const [endX, endY, endZ] = end;

        const stepX = startX <= endX ? 1 : -1;
        const stepY = startY <= endY ? 1 : -1;
        const stepZ = startZ <= endZ ? 1 : -1;

        for (let x = startX; x !== endX + stepX; x += stepX) {

            for (let y = startY; y !== endY + stepY; y += stepY) {

                for (let z = startZ; z !== endZ + stepZ; z += stepZ) {

                    mc.setBlock(mc.newIntPos(x, y, z, 0), this.generateBlock(rules), 0);

                }
            }

        }
    }





    loadMiningArea(player) {

        let fm = mc.newSimpleForm().setTitle("加载矿区")

        let areas = Object.keys(area_data);

        areas.forEach((item) => fm.addButton(item))

        player.sendForm(fm, (player, id) => {

            if (id == null) return false

            let key = areas[id];

            let obj = area_data[key];

            area_data[key].time = new Date().getTime();

            mining_area.set("data", area_data);

            player.teleport(...obj.pos[0])

            this.traverseCube(...obj.pos, obj.rules);

        })


    }

}


let miningArea = new MiningArea();




function debounce1(func, delay) {
    let timeoutId = null;

    return function (...args) {

        if (timeoutId) {
            clearInterval(timeoutId);
        }

        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

const debounce1dOnUseItemOn = debounce1((player, item, block) => {


    if (item.type == "minecraft:wooden_axe") {

        miningArea.choosePos(player, block.pos)

        return false;

    }

    return true;


}, 500);


mc.listen("onUseItemOn", (player, item, block) => {

    debounce1dOnUseItemOn(player, item, block);

});

const macmd = mc.newCommand("mine", skyblock.__i18n.tr("form.blueprint.add"), PermType.GameMasters);

macmd.setAlias("mine");

macmd.setEnum("root", ["add", "load", "save"]);

macmd.mandatory("action", ParamType.Enum, "root", 1);

macmd.overload(["root"]);

macmd.setCallback((_cmd, _ori, out, res) => {

    switch (res.action) {
        case "add":

            miningArea.cachePos[_ori.player.xuid] = [];

            break;

        case "load":

            miningArea.loadMiningArea(_ori.player)

            break;

        case "save":

            miningArea.addMiningArea(_ori.player)

            break;

        default:
            break;
    }



});

macmd.setup();

function timeDiff(time1, time2) {

    const diffMilliseconds = Math.abs(time1 - time2);

    const diffMinutes = diffMilliseconds / (1000 * 60);

    return diffMinutes >= 60;
}


function isLoaded(pos, callback, interval) {

    const checkCondition = () => {

        if (mc.getBlock(...pos) == null) {

            setTimeout(checkCondition, interval);

        } else {

            callback();

            log("已加载...")

        }

    };

    checkCondition();
}


let queueList = [];

setInterval(() => {

    Object.keys(area_data).forEach((key) => {

        const area = area_data[key];

        if (area.time == null) return;

        const currentTimestamp = new Date().getTime();

        if (timeDiff(currentTimestamp, area.time)) {

            if (queueList.includes(key)) return;

            queueList.push(key);

            let loadPos = [...area.pos[0]]

            let dummy = mc.spawnSimulatedPlayer("矿区更新小助手", ...loadPos)

            isLoaded(loadPos, () => {

                dummy.simulateDisconnect();

                area_data[key].time = new Date().getTime();

                mining_area.set("data", area_data);

                queueList.splice(queueList.indexOf(key), 1);

                miningArea.traverseCube(...area.pos, area.rules);

            }, 1000)

        }

    })


}, 3000)

/**
     * 岛屿蓝图
     * @param {Class} Permission
 */

import { config } from "plugins/skyblock/lib/modules/__config.js"

class Blueprint {


    constructor() {

        this.cache = {};

        this.cachePos = {};

    }

    start(key, func, interval) {

        if (this.cache[key]) {

            this.stop(key);
        }

        const timer = setInterval(func, interval);

        this.cache[key] = timer;
    }

    stop(key) {

        if (this.cache[key]) {

            clearInterval(this.cache[key]);

            delete this.cache[key];

        }
    }
    // 计算出生点坐标
    getRectangleDimensions(corner1, corner2) {

        const length = Math.abs(corner1[0] - corner2[0]);

        const width = Math.abs(corner1[1] - corner2[1]);

        const height = Math.abs(corner1[2] - corner2[2]);

        return [length, width, height];

    }

    // 创建边框粒子
    traverseRectBorder(corner1, corner2) {

        const addPoint = (x, y, z) => mc.runcmdEx(`particle minecraft:villager_happy ${x} ${y} ${z}`);

        const [x1, y1, z1] = corner1;
        const [x2, y2, z2] = corner2;

        const [minX, minY, minZ] = [Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2)];
        const [maxX, maxY, maxZ] = [Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2)];

        for (let x = minX; x <= maxX; x++) {
            addPoint(x, minY, z1);
            addPoint(x, maxY, z1);
            addPoint(x, minY, z2);
            addPoint(x, maxY, z2);
        }

        for (let y = minY; y <= maxY; y++) {
            addPoint(minX, y, z1);
            addPoint(maxX, y, z1);
            addPoint(minX, y, z2);
            addPoint(maxX, y, z2);
        }

        for (let z = minZ; z <= maxZ; z++) {
            addPoint(x1, minY, z);
            addPoint(x1, maxY, z);
            addPoint(x2, minY, z);
            addPoint(x2, maxY, z);
        }
    }


    choosePoint(player, pos, point) {

        const selfPos = this.cachePos[player.xuid];

        if (!selfPos) {

            player.sendMsg(skyblock.__i18n.tr("error.buleprint.no_addmode"))

            return;

        }

        if (point == "start") {

            this.cachePos[player.xuid][point] = [...pos];

            player.sendMsg(skyblock.__i18n.tr("blueprint.pos.start"));

        } else if (point == "end") {

            if (selfPos["start"] == null) {

                player.sendMsg(skyblock.__i18n.tr("blueprint.pos.not.start"))

                return;
            }

            this.cachePos[player.xuid][point] = [...pos];

            this.cachePos[player.xuid]["size"] = this.getRectangleDimensions(selfPos.start, selfPos.end);

            this.cachePos[player.xuid]["offset"] = [0, selfPos["size"][2] / 2, 0];


            this.start(player.xuid, () => {

                mc.runcmdEx(`particle minecraft:heart_particle 
                ${Math.floor(((this.cachePos[player.xuid].start[0] + this.cachePos[player.xuid].end[0]) / 2) - this.cachePos[player.xuid].offset[0])} 
                ${Math.floor(Math.min(this.cachePos[player.xuid].start[1], this.cachePos[player.xuid].end[1]) + this.cachePos[player.xuid].offset[1])} 
                ${Math.floor(((this.cachePos[player.xuid].start[2] + this.cachePos[player.xuid].end[2]) / 2) - this.cachePos[player.xuid].offset[2])}`);

                this.traverseRectBorder(selfPos["start"], selfPos["end"]);

            }, 1000)

            player.sendMsg(skyblock.__i18n.tr("blueprint.pos.end"));

            player.sendMsg(skyblock.__i18n.tr("blueprint.set.swpan"));

            this.cachePos[player.xuid]["done"] = true;

        }

    }


    /**
         * 保存蓝图
         * @param {String} xuid
         * @return {Boolean}  是否创建成功
     */

    saveBlueprint(player) {

        if (!this.cachePos[player.xuid]) {

            player.sendMsg(skyblock.__i18n.tr("error.buleprint.no_addmode"));

            return;
        }

        if (this.cachePos[player.xuid].start == null || this.cachePos[player.xuid].end == null) {

            player.sendMsg(skyblock.__i18n.tr("error.buleprint.no_complete_pos"));

            return;
        }

        let selfPos = { start: this.cachePos[player.xuid].start, end: this.cachePos[player.xuid].end, size: this.cachePos[player.xuid].size, offset: this.cachePos[player.xuid].offset }

        let fm = mc.newCustomForm().setTitle(skyblock.__i18n.tr("form.blueprint.add"))

        fm.addInput(skyblock.__i18n.tr("form.blueprint.set_name"))

        fm.addInput(skyblock.__i18n.tr("form.blueprint.set_desc"))

        fm.addInput(skyblock.__i18n.tr("form.blueprint.set_h"), "", "63")


        player.sendForm(fm, (player, dt) => {

            if (dt == null) return false;

            if (dt[0] == '') return player.sendMsg("§c" + skyblock.__i18n.tr("form.blueprint.set_name"));

            let A = new IntPos(...selfPos.start);
            let B = new IntPos(...selfPos.end);

            let SNBT = mc.getStructure(A, B, false, false).toSNBT();

            File.writeTo(`.\\plugins\\skyblock\\structures\\${dt[0]}.json`, SNBT);

            config.data.blueprint.push({
                name: dt[0],
                type: dt[0],
                description: dt[1],
                x: selfPos.size[0],
                y: parseInt(dt[2]),
                z: selfPos.size[2],
                offset: selfPos.offset,
                tag: "blueprint"
            })
            config.set("blueprint", config.data.blueprint);

            player.sendMsg(skyblock.__i18n.tr("form.blueprint.save_success"))

            this.stop(player.xuid);

            delete this.cachePos[player.xuid];

        })

    }

    setBlueprint(player) {

        if (!this.cachePos[player.xuid]) {

            player.sendMsg(skyblock.__i18n.tr("error.buleprint.no_addmode"));

            return;
        }

        if (this.cachePos[player.xuid].start == null || this.cachePos[player.xuid].end == null) {

            player.sendMsg(skyblock.__i18n.tr("error.buleprint.no_complete_pos"));

            return;
        }

        let offset = this.cachePos[player.xuid].offset;

        let fm = mc.newCustomForm().setTitle(skyblock.__i18n.tr("form.blueprint.add"))

        fm.addInput(skyblock.__i18n.tr("form.blueprint.offset") + "X", "1", offset[0].toString())

        fm.addInput(skyblock.__i18n.tr("form.blueprint.offset") + "Y", "1", offset[1].toString())

        fm.addInput(skyblock.__i18n.tr("form.blueprint.offset") + "Z", "1", offset[2].toString())

        player.sendForm(fm, (player, dt) => {

            if (dt == null) return false;

            this.cachePos[player.xuid].offset = [Math.floor(dt[0]), Math.floor(dt[1]), Math.floor(dt[2])]

            player.sendMsg(skyblock.__i18n.tr("form.blueprint.modify_success"))

        })
    }


}


const blueprint = new Blueprint();

function toRawPos(pos) {

    return [Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z), pos.dimid];

}

mc.listen("onServerStarted", () => {

    const bpcmd = mc.newCommand("blueprint", skyblock.__i18n.tr("form.blueprint.add"), PermType.GameMasters);

    bpcmd.setAlias("bp");

    bpcmd.setEnum("root", ["add", "set", "save"]);


    bpcmd.setEnum("choose", ["choose"]);
    bpcmd.setEnum("point", ["a", "b"]);

    bpcmd.mandatory("action", ParamType.Enum, "root", 1);
    bpcmd.mandatory("choose", ParamType.Enum, "choose", 1);
    bpcmd.mandatory("point", ParamType.Enum, "point", 1);

    bpcmd.overload(["root"]);

    bpcmd.overload(["choose", "point"]);

    bpcmd.setCallback((_cmd, _ori, out, res) => {


        switch (res.action) {
            case "add":

                if (blueprint.cachePos[_ori.player.xuid]) {

                    blueprint.stop(_ori.player.xuid);

                    blueprint.cachePos[_ori.player.xuid] = {};

                    return;

                }

                blueprint.cachePos[_ori.player.xuid] = {};

                _ori.player.sendMsg(skyblock.__i18n.tr("form.blueprint.enter_addmode"));

                break;

            case "set":

                blueprint.setBlueprint(_ori.player);

                break;
            case "save":

                blueprint.saveBlueprint(_ori.player);

                break;

            default:
                break;
        }

        switch (res.point) {
            case "a":
                blueprint.choosePoint(_ori.player, toRawPos(_ori.player.pos), "start");
                break;
            case "b":
                blueprint.choosePoint(_ori.player, toRawPos(_ori.player.pos), "end");
                break;

            default:
                break;
        }


    });

    bpcmd.setup();

})



mc.listen("onLeft", (player) => {

    if (blueprint.cachePos[player.xuid]) {

        blueprint.stop(player.xuid);

        delete blueprint.cachePos[player.xuid];
    }

})

function debounce(func, delay) {
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

const debouncedOnUseItemOn = debounce((player, item, block) => {


    if (blueprint.cachePos[player.xuid] && item.type == "minecraft:wooden_axe" && !blueprint.cachePos[player.xuid]["done"]) {

        blueprint.choosePoint(player, toRawPos(block.pos), "start");

        return false;

    }

    return true;


}, 200);


mc.listen("onUseItemOn", (player, item, block) => {

    return debouncedOnUseItemOn(player, item, block);

});



mc.listen("onDestroyBlock", (player, block) => {

    if (blueprint.cachePos[player.xuid] && !blueprint.cachePos[player.xuid]["done"]) {

        blueprint.choosePoint(player, toRawPos(block.pos), "end");

    }


})



export { blueprint }
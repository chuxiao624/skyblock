
ll.registerPlugin("skyblock", "基于LLBDS基岩版的空岛插件", [3, 0, 0]);

import { Perms } from "plugins/skyblock/lib/modules/__permission.js";

import { Coord } from "plugins/skyblock/lib/modules/__coord.js";

import { Event } from "plugins/skyblock/lib/modules/__event.js";

import { Protect } from "plugins/skyblock/lib/modules/__protect.js";

import { blueprint } from "plugins/skyblock/lib/modules/__blueprint.js";

import { Locator } from "plugins/skyblock/lib/modules/__locator.js";

import { config } from "plugins/skyblock/lib/modules/__config.js";

import { __i18n } from "plugins/skyblock/lib/modules/__i18n.js";



globalThis.skyblock = new Object();

const globals = { Perms, Event, Protect, Coord, Locator, blueprint, config, __i18n };

for (const [key, value] of Object.entries(globals)) {

    globalThis.skyblock[key] = value;

}


LLSE_Player.prototype.sendMsg = function (msg, type = 0) {

    this.sendText(`${__i18n.tr("skyblock.prefix")} ${msg}`, type);

}


Object.defineProperty(LLSE_Player.prototype, 'islandID', {

    get: function () {

        return Locator.ids_data[this.xuid]

    }

})

// Object.defineProperty(LLSE_Player.prototype, 'isOwnIsland', {

//     get: function () {

//         return Locator.ids_data[this.xuid]

//     }

// })


Object.defineProperty(LLSE_Player.prototype, 'skyblock', {

    get: function () {

        return Locator.data[this.islandID]

    }

})


Object.defineProperty(LLSE_Player.prototype, 'skyblockSpawn', {

    get: function () {

        return Locator.data[this.islandID].spawn[this.xuid]

    }

})

Object.defineProperty(LLSE_Player.prototype, 'skyblockMembers', {

    get: function () {

        return Locator.data[this.islandID].member

    }

})

Object.defineProperty(LLSE_Player.prototype, 'isIslandOwner', {

    get: function () {

        return Locator.data[this.islandID].xuid == this.xuid

    }

})


Object.defineProperty(LLSE_Player.prototype, 'inIsland', {

    get: function () {

        return Global.inIsland.get(this.xuid)

    }

})


// 全局数据
class GlobalData {

    constructor() {

        this.inIsland = new Map();

    }

    enterIsland(player, id) {

        const currentPlayerIsland = this.inIsland.get(player.xuid);

        if (currentPlayerIsland) {

            this.inIsland.set(player.xuid, id);

            Event.$emit("onInisland", [player, id]);

            return false;

        }

        this.inIsland.set(player.xuid, id);

        Event.$emit("onEnterIsland", [player, id]);

    }

    leaveIsland(player) {
        const id = this.inIsland.get(player.xuid);
        if (!id) return;

        if (!skyblock.Locator.data[id]) {
            this.inIsland.delete(player.xuid);
            return;
        }

        Event.$emit("onLeaveIsland", [player, id]);
        this.inIsland.delete(player.xuid);
    }
}

const Global = new GlobalData();

setInterval(() => {
    const playerList = mc.getOnlinePlayers();
    if (!playerList) return;

    const dt = skyblock.Locator.data;

    for (const player of playerList) {
        const id = Protect.ReturnID(dt, "range", player.pos);
        if (id) {
            Global.enterIsland(player, id);
        } else {
            Global.leaveIsland(player);
        }
    }
}, 500);


function loadStructure() {

    const sourceFolder = ".\\plugins\\skyblock\\structures";
    const targetFolder = ".\\behavior_packs\\vanilla\\structures";

    const sourceFiles = File.getFilesList(sourceFolder);
    const targetFiles = File.getFilesList(targetFolder);

    sourceFiles.forEach((item) => {

        if (!targetFiles.includes(item) && item.endsWith(".mcstructure")) {

            file.copy(`${sourceFolder}\\${item}`, targetFolder)

        }

    });

}


loadStructure();


// 加载依赖
mc.listen("onServerStarted", () => {

    let plugins = File.getFilesList(".\\plugins\\skyblock\\plugins")

    const plugins_file = plugins.filter(filename => filename.endsWith('.js'));

    let count = 0

    plugins_file.forEach((name) => {

        require(`./skyblock/plugins/${name}`)

        count++
    })

    colorLog("green", __i18n.tr("skyblock.plugin.load", { count: count }))

    require('/plugins/skyblock/lib/protect.js');

    colorLog("green", __i18n.tr("skyblock.protect.load"))

    require('/plugins/skyblock/lib/command.js');

    colorLog("green", __i18n.tr("skyblock.command.load"))

})

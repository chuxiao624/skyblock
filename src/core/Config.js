/**
 * 配置管理
 * 启动时把 config/config.json 加载到内存

 */

import { Storage } from "plugins/skyblock/src/core/Storage.js";
import { PATHS } from "plugins/skyblock/src/core/paths.js";

class ConfigManager {
    constructor() {
        this._storage = new Storage(PATHS.CONFIG, "{}");

        // 默认值在这里集中维护 新增字段会自动写盘
        this.data = {
            admins: this._storage.init("admins", []),
            lang: this._storage.init("lang", "zh_CN"),
            island: this._storage.init("island", {
                startX: 0, startZ: 0, range: 64, gap: 800,
            }),
            templates: this._storage.init("templates", [
                {
                    name: "经典空岛",
                    file: "sky1",
                    spawnX: 9, spawnY: 63, spawnZ: 9,
                    pasteOffset: [0, 5, 2],
                    description: "经典空岛,原汁原味",
                    nether_template: {
                        file: "sky1",
                        spawnX: 9, spawnY: 63, spawnZ: 9,
                        pasteOffset: [0, 5, 2],
                    }
                }
            ]),
            respawn: this._storage.init("respawn", [0, 64, 0, 0]),
            reset_limit: this._storage.init("reset_limit", 3),
            warp_limit: this._storage.init("warp_limit", 3),
            member_limit: this._storage.init("member_limit", 3),
            nether_as_island: this._storage.init("nether_as_island", true),
            warp: this._storage.init("warp", {
                maxWarps: 5,
                signTag: "[传送点]",
                activeMark: "§a",
            })
        };
    }

    get(key) { return this.data[key]; }

    set(key, value) {
        this.data[key] = value;
        this._storage.set(key, value);
    }
}

export const config = new ConfigManager();

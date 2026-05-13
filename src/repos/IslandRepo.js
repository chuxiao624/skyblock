/**
 * 岛屿数据仓库
 *
 * 只负责"岛屿数据 + xuid → islandId 索引 + 解散计数" CRUD 之类的
 */

import { Storage } from "plugins/skyblock/src/core/Storage.js";
import { PATHS } from "plugins/skyblock/src/core/paths.js";
import { CONST } from "plugins/skyblock/src/core/constants.js";

class IslandRepo {
    constructor() {
        this._main = new Storage(PATHS.ISLANDS, "{}");
        this._idx = new Storage(PATHS.INDEX, "{}");

        this.islands = this._main.init("data", {});       // islandId -> island
        this.dels = this._main.init("dels", {});       // xuid -> 解散次数
        this.index = this._idx.init("index", {});       // xuid -> islandId
    }

    genId() {
        let id;
        do {
            id = system.randomGuid().toUpperCase().substring(0, CONST.ID_LEN);
        } while (this.islands[id]);
        return id;
    }

    create(islandData) {
        const id = this.genId();
        this.islands[id] = islandData;
        this._main.set("data", this.islands);
        return id;
    }

    get(id) { return this.islands[id]; }

    update(id, key, value) {
        if (!this.islands[id]) return false;
        this.islands[id][key] = value;
        this._main.set("data", this.islands);
        return true;
    }

    remove(id) {
        if (!this.islands[id]) return false;
        // 清理对应索引
        for (const xuid in this.index) {
            if (this.index[xuid] === id) delete this.index[xuid];
        }
        delete this.islands[id];
        this._main.set("data", this.islands);
        this._idx.set("index", this.index);
        return true;
    }

    /** 列出所有岛屿的 range,用于 SpatialGrid 启动期重建 */
    listRanges() {
        const ranges = {};
        for (const id in this.islands) ranges[id] = this.islands[id].range;
        return ranges;
    }

    listAll() { return this.islands; }

    // 索引(xuid → islandId)

    getIndex(xuid) { return this.index[xuid]; }

    setIndex(xuid, islandId) {
        this.index[xuid] = islandId;
        this._idx.set("index", this.index);
    }

    removeIndex(xuid) {
        delete this.index[xuid];
        this._idx.set("index", this.index);
    }

    getDelCount(xuid) { return this.dels[xuid] ?? 0; }

    addDelCount(xuid) {
        this.dels[xuid] = (this.dels[xuid] ?? 0) + 1;
        this._main.set("dels", this.dels);
        return this.dels[xuid];
    }

    resetDelCount(xuid) {
        if (!(xuid in this.dels)) return false;
        delete this.dels[xuid];
        this._main.set("dels", this.dels);
        return true;
    }

    /** 列出指定 kind 的岛屿(默认 normal) */
    listByKind(kind = "normal") {
        const out = {};
        for (const id in this.islands) {
            if ((this.islands[id].kind ?? "normal") === kind) out[id] = this.islands[id];
        }
        return out;
    }
}

export const Island = new IslandRepo();

import { Storage } from "plugins/skyblock/src/core/Storage.js";
import { PATHS } from "plugins/skyblock/src/core/paths.js";

class WarpRepo {
    constructor() {
        this._storage = new Storage(PATHS.WARPS, "{}");
    }

    list(islandId) {
        return this._storage.get(islandId) || {};
    }

    get(islandId, name) {
        return this.list(islandId)[name] ?? null;
    }

    listPublic(islandId) {
        const all = this.list(islandId);
        const out = {};
        for (const k in all) if (all[k].public) out[k] = all[k];
        return out;
    }

    set(islandId, name, signPosKey) {
        const warps = this.list(islandId);
        warps[name] = { sign_pos: signPosKey, public: false };
        this._storage.set(islandId, warps);
    }

    rename(islandId, oldName, newName) {
        const warps = this.list(islandId);
        if (!warps[oldName] || warps[newName]) return false;
        warps[newName] = warps[oldName];
        delete warps[oldName];
        this._storage.set(islandId, warps);
        return true;
    }

    del(islandId, name) {
        const warps = this.list(islandId);
        if (!warps[name]) return false;
        delete warps[name];
        this._storage.set(islandId, warps);
        return true;
    }

    delByPos(islandId, signPosKey) {
        const warps = this.list(islandId);
        const name = Object.keys(warps).find(k => warps[k].sign_pos === signPosKey);
        if (!name) return false;
        return this.del(islandId, name);
    }

    togglePublic(islandId, name) {
        const warps = this.list(islandId);
        if (!warps[name]) return false;
        warps[name].public = !warps[name].public;
        this._storage.set(islandId, warps);
        return warps[name].public;
    }

    /** 返回全部岛屿的 warp*/
    readAll() { return this._storage.readAll(); }
}

export const Warp = new WarpRepo();

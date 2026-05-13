/**
 * 管理员代理仓库
 *
 * 持久化每个管理员的代理状态:
 *   { adminXuid: { oldIsland: islandId|null, proxy: islandId } }
 */

import { Storage } from "plugins/skyblock/src/core/Storage.js";
import { PATHS } from "plugins/skyblock/src/core/paths.js";

class AdminProxyRepo {
    constructor() {
        this._storage = new Storage(PATHS.ADMIN_PROXY, "{}");
        this.cache = this._storage.init("data", {});
    }

    get(adminXuid) { return this.cache[adminXuid] ?? null; }

    has(adminXuid) { return !!this.cache[adminXuid]; }

    set(adminXuid, oldIsland, proxy) {
        this.cache[adminXuid] = { oldIsland: oldIsland ?? null, proxy };
        this._storage.set("data", this.cache);
    }

    remove(adminXuid) {
        if (!this.cache[adminXuid]) return false;
        delete this.cache[adminXuid];
        this._storage.set("data", this.cache);
        return true;
    }

    listAll() { return this.cache; }

    /** 找出代理某个岛屿的所有管理员 */
    findByProxy(islandId) {
        const out = [];
        for (const xuid in this.cache) {
            if (this.cache[xuid].proxy === islandId) out.push(xuid);
        }
        return out;
    }
}

export const AdminProxy = new AdminProxyRepo();

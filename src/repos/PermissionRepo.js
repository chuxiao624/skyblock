/**
 * 岛屿权限仓库
 *
 * 负责每个岛屿的 defaults / allowlist / roles / events 数据
 * 启动时 _migrate 把模板更新过的 defaults / events 字段补全
 */

import { Storage } from "plugins/skyblock/src/core/Storage.js";
import { PATHS } from "plugins/skyblock/src/core/paths.js";

const TEMPLATE = {
    defaults: {
        destroy_block: false,
        place_block: false,
        atk_player: true,
        atk_friendly_mob: false,
        atk_hostile_mob: true,
        take_item: true,
        drop_item: true,
        ride_entity: false,
        interact_entity: false,
        use_armor_stand: false,
        use_item_frame: false,
        use_tools: false,
        use_bucket: false,
        use_bone_meal: false,
        use_fishing: false,
        use_throwable: false,
        place_boat: false,
        place_minecart: false,
        use_pressure_plate: true,
        use_button: true,
        use_lever: true,
        use_door: true,
        use_sign: false,
        use_container: false,
        use_barrel: false,
        use_hopper: false,
        use_dispenser: false,
        use_dropper: false,
        use_furnace: false,
        use_crafting_table: true,
        use_workbench: false,
        use_anvil: false,
        use_enchanting_table: true,
        use_bookshelf: false,
        use_jukebox: false,
        use_noteblock: false,
        use_cake: false,
        use_comparator: false,
        use_repeater: false,
        use_lectern: false,
        use_respawn_anchor: false,
        use_beacon: false,
        use_bed: true,
    },
    allowlist: {},
    roles: {},
    events: {
        onEntityExplode: false,
        onWitherBossDestroy: false,
        onFireSpread: false,
        onBlockExplode: false,
        onRespawnAnchorExplode: false,
        onFarmLandDecay: false,
    },
};

class PermissionRepo {
    constructor() {
        this._storage = new Storage(PATHS.PERMS, "{}");
        this.cache = this._storage.init("data", {});
        this._migrate();
    }

    /** 模板对齐:补字段 + 删过期字段(只对 defaults/events 这两块强对齐) */
    _migrate() {
        for (const id in this.cache) {
            this.cache[id] = this._mergeTemplate(this.cache[id]);
        }
        this._storage.set("data", this.cache);
    }

    _mergeSection(data, tpl) {
        if (!data) return JSON.parse(JSON.stringify(tpl));
        for (const k in tpl) if (!(k in data)) data[k] = tpl[k];
        for (const k in data) if (!(k in tpl)) delete data[k];
        return data;
    }

    _mergeTemplate(data) {
        data.defaults = this._mergeSection(data.defaults, TEMPLATE.defaults);
        data.events = this._mergeSection(data.events, TEMPLATE.events);
        data.allowlist = data.allowlist || {};
        data.roles = data.roles || {};
        return data;
    }

    /** 给新岛屿初始化一份默认权限 */
    init(islandId) {
        if (this.cache[islandId]) return false;
        this.cache[islandId] = JSON.parse(JSON.stringify(TEMPLATE));
        this._storage.set("data", this.cache);
        return true;
    }

    remove(islandId) {
        if (!this.cache[islandId]) return false;
        delete this.cache[islandId];
        this._storage.set("data", this.cache);
        return true;
    }

    get(islandId, key) {
        if (key) return this.cache[islandId]?.[key];
        return this.cache[islandId];
    }

    set(islandId, key, value) {
        if (!this.cache[islandId]) return false;
        this.cache[islandId][key] = value;
        this._storage.set("data", this.cache);
        return true;
    }

    static get TEMPLATE() { return TEMPLATE; }
}

export const Permission = new PermissionRepo();

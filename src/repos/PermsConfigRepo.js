/**
 * 全局权限配置(按维度)
 *
 * config/permissions.json 的结构:
 *   { overworld: {...}, nether: {...}, end: {...} }
 *
 * 用于:
 *    玩家在岛屿外的默认权限 
 *    末地 / 地狱(若 nether_as_island=false)的全局权限
 */

import { Storage } from "plugins/skyblock/src/core/Storage.js";
import { PATHS } from "plugins/skyblock/src/core/paths.js";
import { CONST } from "plugins/skyblock/src/core/constants.js";

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
        use_sign: true,
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
    events: {
        onEntityExplode: false,
        onWitherBossDestroy: false,
        onFireSpread: false,
        onBlockExplode: false,
        onRespawnAnchorExplode: false,
        onFarmLandDecay: false,
    },
};

class PermsConfigRepo {
    constructor() {
        this._storage = new Storage(PATHS.PERMS_CONFIG, "{}");
        this.overworld = this._merge(this._storage.init("overworld", TEMPLATE));
        this.nether = this._merge(this._storage.init("nether", TEMPLATE));
        this.end = this._merge(this._storage.init("end", TEMPLATE));
    }

    _merge(data) {
        for (const section of ["defaults", "events"]) {
            const tpl = TEMPLATE[section];
            const dat = data[section] || (data[section] = {});
            for (const k in tpl) if (!(k in dat)) dat[k] = tpl[k];
            for (const k in dat) if (!(k in tpl)) delete dat[k];
        }
        return data;
    }

    _byDim(dim) {
        if (dim === CONST.DIM_NETHER) return this.nether;
        if (dim === CONST.DIM_END) return this.end;
        return this.overworld;
    }

    getDefault(key, dim = 0) { return this._byDim(dim).defaults[key]; }
    getEvent(key, dim = 0) { return this._byDim(dim).events[key]; }
}

export const PermsCfg = new PermsConfigRepo();


class ConfigurationManager {

    constructor() {

        this.File = new JsonConfigFile('.\\plugins\\skyblock\\config.json', '{}');

        this.data = {

            language: this.File.init("language", "zh_cn"),

            island: this.File.init("island", {
                x: 0,
                y: 0,
                range: 64,
                distance: 800,
            }),

            base: this.File.init("base", {
                respawn: [0, 10, 0, 0],
                reset_limit: 3,
                max_members: 3,
                open_the_end: true,
                open_the_nether: true,

            }),

            blueprint: this.File.init("blueprint",
                [
                    {
                        name: "经典空岛",
                        type: "sky1",
                        x: 9,
                        y: 63,
                        z: 9,
                        offset: [0, 5, 2],
                        description: "经典空岛，原汁原味。"
                    }
                ]
            ),
            worldPermission: this.File.init("worldPermission",
                {
                    destroy_block: false,
                    place_block: false,
                    drop_item: true,
                    take_item: true,
                    atk_friendly_mob: false,
                    atk_hostile_mob: false,
                    atk_player: false,
                    allow_ues_crafting_table: true,
                    allow_ues_furnace: false,
                    allow_ues_blast_furnace: false,
                    allow_ues_smoker: false,
                    allow_ues_enchanting_table: true,
                    allow_ues_beacon: false,
                    allow_open_anvil: false,
                    allow_open_barrel: false,
                    allow_open_hopper: false,
                    allow_open_chest: false,
                    allow_open_dropper: false,
                    allow_open_dispenser: false,
                    allow_open_shulker_box: false,
                    allow_open_firegen: false,
                    allow_use_projectile: false,
                    allow_use_bucket: false,
                }
            ),
            worldEvent: this.File.init("worldEvent", {
                onEntityExplode: false,
                onWitherBossDestroy: false,
                onFireSpread: false,
                onBlockExplode: false,
                onRespawnAnchorExplode: false,
                onFarmLandDecay: false
            })

        }

    }

    get(key) {

        return this.data[key]

    }


    set(key, value) {

        this.data[key] = value;

        this.File.set(key, value);

    }

}

const config = new ConfigurationManager();


export { config }

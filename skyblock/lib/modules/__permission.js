/**
     * 权限管理
     * @param {Class} Permission
 */

// let path = '.\\plugins\\permission\\data.json'

class Permission {

    constructor() {

        this.File = new JsonConfigFile('.\\plugins\\skyblock\\data\\permission\\permission.json', '{}');

        this.Permission = new Proxy(this.File.init("data", {}), {

            set: (target, property, value) => {

                target[property] = value;

                this.File.set("data", this.Permission);

                return true;

            }

        });

        this.permissionTemplate = {
            whitelist: {},
            role: {},
            permissions: {
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
                allow_use_wall_sign: false,
                allow_use_armorstand: false,
                allow_use_frameblock: false,
                allow_use_tools: false
            },
            events: {
                onEntityExplode: false,
                onWitherBossDestroy: false,
                onFireSpread: false,
                onBlockExplode: false,
                onRespawnAnchorExplode: false,
                onFarmLandDecay: false
            }
        };

        this.updata();

    }
    /**
        * 创建权限
        * @param {String} id
     */
    createPermission(id) {

        if (this.Permission.hasOwnProperty(id)) return null

        this.Permission[id] = this.permissionTemplate

    }

    /**
        * 检查玩家是否拥有某岛屿权限
        * @param {String} xuid 玩家xuid
        * @param {String} id 岛屿ID
        * @param {String} key 权限名
        * @return {true | false} 是否拥有权限
    */

    checkPermission(xuid, id, key) {

        const { permissions, whitelist, customPermission } = this.Permission[id];


        // log(customPermission?.[key])

        if (customPermission?.[key] !== undefined) return customPermission[key];


        return permissions[key] || whitelist[xuid]?.includes(key) || false;

    }

    checkEvent(id, subject) {

        if (this.Permission[id]?.events?.[subject] !== undefined) return this.Permission[id].events[subject];

    }


    /**
        * 设置岛屿权限
        * @param {String} id 岛屿ID
        * @param {String} key 权限名
        * @param {Boolean} value 设置状态
        * @param {Boolean} isArray 可选
        * @return {true | false} 设置成功或失败
    */

    setPermission(id, isObject, value, key) {

        if (isObject) {

            this.Permission[id]["permissions"] = value;

            this.Permission[id] = this.Permission[id];

            return true;
        }

        this.Permission[id][key] = value;

        // updata
        this.Permission[id] = this.Permission[id];

        return true;
    }

    /**
      * 给某位玩家添加权限
      * @param {String} xuid 玩家xuid
      * @param {String} id 岛屿id
      * @param {Array} keys 要添加的权限项
      * @return {true | false} 设置成功或失败
  */

    addPermissionsToPlayer(xuid, id, keys, isCover = false) {

        let whitelist = this.Permission[id].whitelist

        if (!whitelist.hasOwnProperty(xuid)) this.Permission[id].whitelist[xuid] = [];

        keys.forEach((key) => {

            if (!whitelist[xuid].includes(key)) whitelist[xuid].push(key);

        });

        this.Permission[id].whitelist = whitelist;

        if (isCover) {

            this.Permission[id].whitelist[xuid] = keys;

        }


        // updata
        this.Permission[id] = this.Permission[id];

    }

    /**
        * 添加新的权限控制项
        * @param {String} name 权限名
        * @param {String} open 默认状态
        * @return {true | false} 设置成功或失败
    */
    createPermissionItem(name, open = false) {

        this.permissionTemplate.permissions[name] = open;

        // this.updata();
    }


    adddCustomPermission(id, name, open = false) {

        if (!this.Permission[id].customPermission) this.Permission[id].customPermission = {};

        this.Permission[id].customPermission[name] = open;

        this.File.set("data", this.Permission);

        return true;

    }

    mergeObjects(obj1, obj2) {
        for (let key in obj2) {
            if (obj2.hasOwnProperty(key)) {
                if (typeof obj2[key] === 'object' && !Array.isArray(obj2[key])) {
                    if (!obj1.hasOwnProperty(key) || typeof obj1[key] !== 'object' || Array.isArray(obj1[key])) {
                        obj1[key] = {};
                    }
                    this.mergeObjects(obj1[key], obj2[key]); // 递归合并嵌套对象
                } else if (!obj1.hasOwnProperty(key)) {
                    obj1[key] = obj2[key];
                }
            }
        }

        //2024.01.22 更新 移除events.onUseFrameBlock

        if (obj1.events?.onUseFrameBlock != null) {

            delete obj1.events.onUseFrameBlock;

        }

        return obj1;
    }




    getPermission(id) {

        return this.Permission[id];

    }


    getPermissionList(id) {

        return this.Permission[id]["permissions"];

    }


    /**
         * 统一更新数据
         * @return {void}
     */
    updata() {

        Object.keys(this.Permission).forEach((key) => {

            this.Permission[key] = this.mergeObjects(this.Permission[key], this.permissionTemplate)

            this.Permission[key] = this.Permission[key];

        })

    }

    /**
        * 删除岛屿权限
        * @param {String} id 岛屿id
        * @return {true | false} 设置成功或失败
    */
    removePermission(id) {

        if (!this.Permission[id]) return false;

        delete this.Permission[id];

        this.File.set("data", this.Permission);

        return true;

    }

}




const Perms = new Permission()

export { Perms };
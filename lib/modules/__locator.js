
import { Coord } from "plugins/skyblock/lib/modules/__coord.js"


/** 
 * @param {Object} islandLocator 岛屿管理器 
 */


class islandLocator {

    constructor() {

        this.File = new JsonConfigFile('.\\plugins\\skyblock\\data\\data.json', '{}');

        this.ids_file = new JsonConfigFile('.\\plugins\\skyblock\\data\\ids\\ids.json', '{}');

        this.ids_data = this.ids_file.init("data", {});

        this.data = this.File.init("data", {});

        this.dels = this.File.init("dels", {});

        this.state = Coord.state;

        this.cache = {};

    }

    getRandomID() {

        let str;

        do {

            str = system.randomGuid().toUpperCase().substring(0, 16)

        } while (this.data.hasOwnProperty(str))

        return str;
    }


    createIsland(player, blueprint, isSave = true) {

        const id = this.getRandomID()

        const pos = Coord.getNewCoord()

        // 创建岛屿权限
        skyblock.Perms.createPermission(id)

        // 创建数据

        if (isSave) {

            this.ids_data[player.xuid] = id

        }


        // 计算加载位置

        const { x, y, z, type, offset, tag } = blueprint;

        const centerX = Math.floor((pos[0][0] + pos[1][0]) / 2);
        const centerZ = Math.floor((pos[0][1] + pos[1][1]) / 2);

        let reset = this.dels[player.xuid] == null ? 0 : this.dels[player.xuid];

        this.data[id] = {
            name: player.name,
            xuid: player.xuid,
            member: [],
            nickname: "",
            reset: reset,
            range: pos,
            spawn: {}
        }

        this.data[id].spawn[player.xuid] = [centerX - offset[0], y + offset[1], centerZ - offset[2], 0]

        const loadPosX = centerX - Math.floor(x / 2);

        const loadPosZ = centerZ - Math.floor(z / 2);



        // 加载蓝图

        player.teleport(centerX, 320, centerZ - 2, 0)

        this.start(player.xuid, () => {

            if (player.pos.y < 320 || mc.getBlock(centerX, 310, centerZ - 2, 0) != null) {


                if (tag) {

                    let SNBT = File.readFrom(`.\\plugins\\skyblock\\structures\\${type}.json`);

                    let nbt = NBT.parseSNBT(SNBT);

                    mc.setStructure(nbt, new IntPos(loadPosX, y, loadPosZ, 0));

                    player.refreshChunks();

                } else {

                    mc.runcmdEx(`structure load ${type} ${loadPosX} ${y} ${loadPosZ}`)

                }

                player.teleport(...this.data[id].spawn[player.xuid])

                this.stop(player.xuid)

                player.setRespawnPosition(...this.data[id].spawn[player.xuid])

                // 触发岛屿创建事件
                skyblock.Event.$emit("onCreateIsland", [player, id, blueprint.type]);

                // 更新数据
                this.updata();

            }

        }, 100)


        return id
    }


    deleteIsland(player, isplayer = true) {


        const id = player.islandID;

        if (isplayer) {

            skyblock.Event.$emit("onDeleteIsland", [player, id]);

            if (this.dels[player.xuid] == null) {

                this.dels[player.xuid] = 1;

            } else {

                this.dels[player.xuid]++;

            }

            delete this.ids_data[player.xuid];

        }

        delete this.data[id];

        skyblock.Perms.removePermission(id);

        this.updata();

        return true

    }

    addKeyToObject(obj, key) {

        const newObj = { ...obj }

        newObj[key] = Object.values(obj)[0]

        return newObj
    }

    addMember(player, id) {

        if (player.islandID) {

            this.deleteIsland(player)

        }

        this.ids_data[player.xuid] = id

        this.data[id].member.push(player.xuid)

        this.data[id].spawn = this.addKeyToObject(this.data[id].spawn, [player.xuid])

        this.updata();

        player.teleport(...player.skyblockSpawn);

    }

    removeMember(id, name) {

        const xuid = data.name2xuid(name)

        this.data[id].member.splice(this.data[id].member.indexOf(xuid), 1)

        delete this.data[id].spawn[xuid]

        delete this.ids_data[xuid]

        this.updata();

    }

    setIslandData(id, key, data) {

        this.data[id][key] = data;

        this.updata();

    }

    updata() {

        this.ids_file.set("data", this.ids_data)

        this.File.set("data", this.data);

        this.File.set("dels", this.dels);

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


    convertIslandData(name, xuid, range, height) {

        const id = this.getRandomID()

        const pos = range

        this.ids_data[xuid] = id

        skyblock.Perms.createPermission(id)

        const centerX = Math.floor((pos[0][0] + pos[1][0]) / 2);
        const centerZ = Math.floor((pos[0][1] + pos[1][1]) / 2);

        this.data[id] = {
            name: name,
            xuid: xuid,
            member: [],
            nickname: "",
            reset: 0,
            range: pos,
            spawn: {}
        }


        this.data[id].spawn[xuid] = [centerX, height, centerZ, 0]

        this.updata();

    }


    convertPos(num) {

        for (let i = 0; i < num; i++) {

            Coord.getNewCoord()

        }

    }


    checkIntersection(newRectangle) {

        let rectangles = Object.values(this.data).map(({ range }) => range);

        for (const [rectangleStart, rectangleEnd] of rectangles) {

            const [newStartX, newStartY] = newRectangle[0];
            const [newEndX, newEndY] = newRectangle[1];
            const [rectStartX, rectStartY] = rectangleStart;
            const [rectEndX, rectEndY] = rectangleEnd;

            if (
                Math.max(newStartX, newEndX) >= Math.min(rectStartX, rectEndX) &&
                Math.min(newStartX, newEndX) <= Math.max(rectStartX, rectEndX) &&
                Math.max(newStartY, newEndY) >= Math.min(rectStartY, rectEndY) &&
                Math.min(newStartY, newEndY) <= Math.max(rectStartY, rectEndY)
            ) {
                return false;
            }
        }

        return true;
    }


    filterB() {

        const newB = Object.fromEntries(
            Object.entries(this.data).filter(([key]) => valuesInA.has(key))
        );


        this.ids_file.set("data", this.ids_data)

        this.File.set("data", newB);


    }


}


const Locator = new islandLocator();



export { Locator }
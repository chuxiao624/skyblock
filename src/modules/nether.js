/**
 * 将下界作为玩家的岛屿 加载一下模板
 * 仅在 nether_as_island 开启时生效
 */

import { Event } from "plugins/skyblock/src/core/EventBus.js";
import { config } from "plugins/skyblock/src/core/Config.js";
import { L } from "plugins/skyblock/src/core/Logger.js";

const log = L("Nether");

if (config.get("nether_as_island")) {

    Event.on("island:created", (xuid, islandId, range, template) => {
        try {

            const center = range.center;

            const netherTemplate = template?.nether_template;
            if (!netherTemplate) {
                return log.error(`${islandId} 没有 nether_template 配置 下界模板不会被加载`);
            }
            const { spawnX, spawnY, spawnZ, file, pasteOffset } = netherTemplate;

            const loadPosX = center.x - Math.floor(spawnX / 2);
            const loadPosZ = center.z - Math.floor(spawnZ / 2);
            const loadPosY = spawnY;

            const tagName = `nether${islandId}`

            mc.runcmdEx(`execute in nether run structure load ${file} ${loadPosX} ${loadPosY} ${loadPosZ}`);

            log.info(`{g}下界岛屿 {y}${islandId} {g}已加入队列 , 玩家进入地狱自动创建`);

        } catch (e) {
            log.error("处理 island:created 失败:", e);
        }
    })

}

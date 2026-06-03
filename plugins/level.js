
const RANKING_FILE = new JsonConfigFile("./plugins/skyblock/plugins/level/config.json", "{}");


let ranking = RANKING_FILE.init("ranking", {});

const BLOCK_SCORE_FILE = new JsonConfigFile("./plugins/skyblock/plugins/level/block_score.json", "{}")

let BLOCK_SCORE = BLOCK_SCORE_FILE.init("data", {});



function getChunkColumns(min, max) {
    const columns = [];
    for (let cx = min[0]; cx < max[0]; cx += 16) {
        for (let cz = min[1]; cz < max[1]; cz += 16) {
            columns.push({
                minX: cx,
                minZ: cz,
                maxX: Math.min(cx + 15, max[0] - 1),
                maxZ: Math.min(cz + 15, max[1] - 1),
            });
        }
    }
    return columns;
}

function scanColumn(col) {
    let score = 0;

    const structure = mc.getStructure(
        new IntPos(col.minX, -64, col.minZ, 0),
        new IntPos(col.maxX, 384, col.maxZ, 0)
    );
    if (!structure) return 0;

    const structureTag = structure.getTag("structure");
    if (!structureTag) return 0;

    const palette = structureTag
        .getTag("palette")
        .getTag("default")
        .getTag("block_palette")
        .toArray();

    const indices = structureTag
        .getTag("block_indices")
        .getTag(0)
        .toArray();

    for (const index of indices) {
        if (index === -1) continue;
        const name = palette[index]?.name;
        if (!name || name === "minecraft:air") continue;
        score += BLOCK_SCORE[name] ?? 0;
    }

    return score;
}

/**
 * 分帧扫描整个岛屿
 * @param {string} islandId
 * @param {{ min: number[], max: number[] }} range
 * @param {(islandId: string, score: number) => void} onDone
 */
function calcIslandLevel(islandId, range, xuid) {


    const columns = getChunkColumns(range.min, range.max);
    const total = columns.length;
    let current = 0;
    let totalScore = 0;


    function nextColumn() {

        if (current >= total) {

            let level = Math.floor(totalScore / 100);

            ranking[islandId] = level;

            RANKING_FILE.set("ranking", ranking);

            mc.getPlayer(xuid)?.sendMsg(`§a计算完成 当前岛屿等级为 §e${level} §a距离下个等级还需要 §e${100 - (totalScore % 100)} §a点数`);

            return;
        }
        const col = columns[current];
        totalScore += scanColumn(col);
        current++;
        setTimeout(nextColumn, 0);
    }
    nextColumn();
}



const cooldown = new Map();

const CD = 1000 * 60 * 5; // 5分钟冷却

function canUse(player) {
    const now = Date.now();

    const lastUse = cooldown.get(player.xuid) || 0;

    if (now - lastUse < CD) {
        const remain = Math.ceil((CD - (now - lastUse)) / 1000 / 60);
        player.sendMsg(`冷却中，还需要 ${remain} 分钟`);
        return false;
    }

    cooldown.set(player.xuid, now);
    return true;
}




// 计算岛屿等级
function cmdCalc(player) {

    const islandId = player.islandId;

    if (!islandId) return player.sendMsg("§c你还没有岛屿");

    if (!canUse(player)) return;

    player.sendMsg("§a开始计算岛屿等级 , 请稍候...");

    const islandData = skyblock.island.getIslandData(islandId);

    calcIslandLevel(islandId, islandData.range, player.xuid);
}

// 岛屿等级排行榜
function cmdTop(player) {

    const entries = Object.entries(ranking)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (entries.length == 0) return player.sendMsg("§c暂无排行榜数据");

    let msg = "§6§l===== 岛屿等级排行榜 =====\n";

    entries.forEach(([islandId, level], idx) => {

        const islandData = skyblock.island.getIslandData(islandId);

        if (!islandData) return;

        const members = Object.keys(islandData.members).map(xuid => data.xuid2name(xuid)).join(", ");

        msg += `§e#${idx + 1} §f${islandData.name} [${members}] §7- §a${level}\n`;
    });

    player.tell(msg.trimEnd());
}

// 查看手中方块价值
function cmdCheck(player) {
    const item = player.getHand();

    if (!item || item.type === "minecraft:air") return player.sendMsg("§c请手持一个方块");

    const blockId = item.type;

    const score = BLOCK_SCORE[blockId];

    if (score === undefined) {
        player.sendMsg(`§e${blockId} §c一文不值`);
    } else {
        player.sendMsg(`§e${blockId} §7的价值为 §a${score} §7分`);
    }
}

// 设置某个方块的分数
function cmdSet(player, value) {

    if (!player.isOP()) return player.sendMsg("§c你没有权限执行此指令");

    const item = player.getHand();

    if (!item || item.type === "minecraft:air") return player.sendMsg("§c请手持一个方块");

    const val = Number(value);

    if (isNaN(val) || val < 0) return player.sendMsg("§c价值必须为非负数");

    const blockId = item.type;

    BLOCK_SCORE[blockId] = val;

    BLOCK_SCORE_FILE.set("data", BLOCK_SCORE);

    player.sendMsg(`§a已将 §e${blockId} §a的价值设置为 §e${val}`);
}


skyblock.Command.registerAll({
    "level": {
        enums: { level_action: ["calc", "top", "check", "set"] },
        params: { level_value: ParamType.Int },
        overloads: [
            ["level_action"],
            ["level_action", "level_value"],
        ],
        callback: (origin, output, results) => {
            const player = origin.player;
            if (!player) return;

            switch (results.level_action) {
                case "calc": return cmdCalc(player);
                case "top": return cmdTop(player);
                case "check": return cmdCheck(player);
                case "set": return cmdSet(player, results.level_value);
            }
        }
    }
});

const ext = "§e/is level calc §7- 计算岛屿等级\n§e/is level top §7- 岛屿等级排行榜\n§e/is level check §7- 查看手持方块价值\n§e/is level set <数值> §7- 设置手持方块价值";
skyblock.Store.set("help", skyblock.Store.get("help") + ext, true);

// 岛屿删除时清理排行榜记录,防止数据污染
skyblock.Event.on("island:removed", ({ islandId }) => {
    if (ranking[islandId] !== undefined) {
        delete ranking[islandId];
        RANKING_FILE.set("ranking", ranking);
    }
});

skyblock.Store.register("islandLevel:get", (islandId) => ranking[islandId] || 0, true);

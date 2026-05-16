const DATA_DIR = '.\\plugins\\skyblock\\plugins\\challenges\\data\\';

const DEFAULT_LEVELS = [
    { name: '新手', icon: 'textures/items/apple', unlock: null },
    { name: '基础', icon: 'textures/items/wood_pickaxe', unlock: { from: '新手', count: 5 } },
    { name: '简单', icon: 'textures/items/iron_ingot', unlock: { from: '基础', count: 6 } },
    { name: '普通', icon: 'textures/items/diamond', unlock: { from: '简单', count: 6 } },
    { name: '困难', icon: 'textures/items/netherite_ingot', unlock: { from: '普通', count: 6 } }
];

class ChallengeStorage {

    constructor(dir) {
        this.dataFile = new JsonConfigFile(dir + 'data.json', '{}');
        this.playerFile = new JsonConfigFile(dir + 'player.json', '{}');

        this.levels = this.dataFile.init('levels', DEFAULT_LEVELS);
        this.challenges = this.dataFile.init('challenges', {});
        this.nbtTemplates = this.dataFile.init('nbtTemplates', {});
        this.playerData = this.playerFile.init('data', {});
    }
    savePlayer() {
        this.playerFile.set('data', this.playerData);
    }

    findLevel(name) {
        return this.levels.find(l => l.name === name);
    }
}


const Checkers = {};
const Rewarders = {};

function registerChecker(type, fn) { Checkers[type] = fn; }
function registerRewarder(type, fn) { Rewarders[type] = fn; }


// 拥有并消耗指定物品
registerChecker('inventory', (player, params) => {

    // 合并重复项，防止 [{dirt, 32}, {dirt, 32}] 这种写法导致重复扣
    const merged = {};
    for (const r of params.items) merged[r.id] = (merged[r.id] || 0) + r.count;
    const reqs = Object.keys(merged).map(id => ({ id, count: merged[id] }));

    const inv = player.getInventory();
    const items = inv.getAllItems();

    // 先验证
    for (const req of reqs) {
        const total = items.reduce((s, it) => it.type === req.id ? s + it.count : s, 0);
        if (total < req.count) {
            return { ok: false, msg: `§c你没有足够的 §e${req.id}§c [§e${req.count}§c]` };
        }
    }

    // 后扣除
    for (const req of reqs) {
        let need = req.count;
        for (let i = 0; i < items.length && need > 0; i++) {
            const it = items[i];
            if (it.type !== req.id) continue;
            const take = Math.min(need, it.count);
            inv.removeItem(i, take);
            it.count -= take;
            need -= take;
        }
    }
    player.refreshItems();
    return { ok: true };
});

// 身边有指定方块
registerChecker('block', (player, params) => {

    const radius = params.radius ?? 3;
    const required = new Set(params.blocks);
    const found = new Set();
    const { x, y, z, dimid } = player.pos;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const b = mc.getBlock(x + dx, y + dy, z + dz, dimid);
                if (b && required.has(b.type)) found.add(b.type);
            }
        }
    }

    if (found.size < required.size) {
        return { ok: false, msg: '§c你身边缺少指定的方块' };
    }
    return { ok: true };
});

// 身边有指定实体
registerChecker('entity', (player, params) => {

    const radius = params.radius ?? 10;
    const r2 = radius * radius;
    const need = {};
    for (const r of params.entities) need[r.id] = r.count;
    const have = {};
    const { x, y, z, dimid } = player.pos;

    for (const en of mc.getAllEntities()) {
        if (need[en.type] === undefined) continue;
        const ep = en.pos;
        if (ep.dimid !== dimid) continue;
        const dxx = ep.x - x, dyy = ep.y - y, dzz = ep.z - z;
        if (dxx * dxx + dyy * dyy + dzz * dzz <= r2) {
            have[en.type] = (have[en.type] || 0) + 1;
        }
    }

    for (const r of params.entities) {
        if ((have[r.id] || 0) < r.count) {
            return { ok: false, msg: `§c你身边缺少 §e${r.id}§c [§e${r.count}§c]` };
        }
    }
    return { ok: true };
});

// 岛屿等级
registerChecker('level', (player, params) => {
    const lv = skyblock.Store.call('islandLevel:get', player.islandId) ?? 0;
    if (lv < params.level) {
        return { ok: false, msg: `§c岛屿等级不足 当前 §e${lv}§c / §e${params.level}` };
    }
    return { ok: true };
});


// 给玩家物品
function giveStacked(player, item, count) {
    while (count > 0) {
        const give = Math.min(count, 64);
        player.giveItem(item, give);
        count -= give;
    }
}

// 物品
registerRewarder('item', (player, params) => {
    const it = mc.newItem(params.id, 1);
    if (!it) {
        player.sendMsg(`§c物品 §e${params.id}§c 创建失败`);
        return;
    }
    giveStacked(player, it, params.count);
    player.refreshItems();
});

// nbt
registerRewarder('nbt', (player, params, ctx) => {
    const snbt = ctx.storage.nbtTemplates[params.template];
    if (!snbt) {
        player.sendMsg(`§cNBT 模板 §e${params.template}§c 不存在`);
        return;
    }
    const it = mc.newItem(NBT.parseSNBT(snbt));
    if (!it) return;
    giveStacked(player, it, params.count);
    player.refreshItems();
});
// ll money
registerRewarder('money', (player, params) => player.addMoney(params.amount));
registerRewarder('score', (player, params) => player.addScore(params.name, params.amount));
registerRewarder('exp', (player, params) => player.addExperience(params.amount));
registerRewarder('level', (player, params) => player.addLevel(params.amount));

registerRewarder('command', (player, params) => {
    const cmd = params.command.replace(/\{player\}/g, player.realName);
    mc.runcmdEx(cmd);
});


function describeReward(r) {
    switch (r.type) {
        case 'item': return `${r.id} x${r.count}`;
        case 'nbt': return `[NBT] ${r.template} x${r.count}`;
        case 'money': return `金钱 +${r.amount}`;
        case 'score': return `${r.name} +${r.amount}`;
        case 'exp': return `经验 +${r.amount}`;
        case 'level': return `经验等级 +${r.amount}`;
        case 'command': return `[执行命令]`;
        default: return `[未知奖励: ${r.type}]`;
    }
}

function describeRewards(rewards) {
    if (!rewards || rewards.length === 0) return '无';
    return rewards.map(describeReward).join('  §3|§r  ');
}


class ChallengeManager {

    constructor(storage) {
        this.storage = storage;
    }

    getProgress(xuid) {
        let p = this.storage.playerData[xuid];
        if (!p) {
            p = {};
            this.storage.playerData[xuid] = p;
        }
        return p;
    }

    getCompletedTimes(xuid, challengeId) {
        return this.storage.playerData[xuid]?.[challengeId] || 0;
    }

    countCompletedInLevel(xuid, levelName) {
        const p = this.storage.playerData[xuid] || {};
        const challenges = this.storage.challenges;
        let n = 0;
        for (const id in p) {
            if (p[id] > 0 && challenges[id] && challenges[id].level === levelName) n++;
        }
        return n;
    }

    isLevelUnlocked(xuid, levelName) {
        const lv = this.storage.findLevel(levelName);
        if (!lv || !lv.unlock) return true;
        return this.countCompletedInLevel(xuid, lv.unlock.from) >= lv.unlock.count;
    }

    listChallengesInLevel(levelName) {
        const challenges = this.storage.challenges;
        return Object.keys(challenges).filter(id => challenges[id].level === levelName);
    }

    trySubmit(player, challengeId) {

        if (!player.guardInIsland()) return;

        const ch = this.storage.challenges[challengeId];
        if (!ch) {
            player.sendMsg('§c该挑战已不存在');
            return;
        }

        if (!this.isLevelUnlocked(player.xuid, ch.level)) {
            player.sendMsg('§c当前等级尚未解锁');
            return;
        }

        const times = this.getCompletedTimes(player.xuid, challengeId);
        if (times >= ch.maxTimes) {
            player.sendMsg('§c你已经完成过该任务了');
            return;
        }

        const checker = Checkers[ch.check.type];
        if (!checker) {
            player.sendMsg(`§c未知的挑战类型: §e${ch.check.type}`);
            return;
        }

        const ctx = { storage: this.storage };
        const result = checker(player, ch.check, ctx);
        if (!result.ok) {
            if (result.msg) player.sendMsg(result.msg);
            return;
        }

        for (const reward of ch.rewards) {
            const rewarder = Rewarders[reward.type];
            if (rewarder) rewarder(player, reward, ctx);
            else player.sendMsg(`§c未知的奖励类型: §e${reward.type}`);
        }

        const progress = this.getProgress(player.xuid);
        progress[challengeId] = times + 1;
        this.storage.savePlayer();

        mc.runcmdEx(`playsound random.levelup ${player.realName}`);

        mc.broadcast(`§a玩家 §e${player.realName} §a完成了 §e${ch.name}`);
    }
}


class ChallengeUI {

    constructor(manager) {
        this.manager = manager;
    }

    showLevels(player) {
        const levels = this.manager.storage.levels;
        const fm = mc.newSimpleForm().setTitle('岛屿任务');

        for (const lv of levels) {
            const color = this.manager.isLevelUnlocked(player.xuid, lv.name) ? '§a' : '§c';
            if (lv.icon) fm.addButton(`${color}${lv.name}`, lv.icon);
            else fm.addButton(`${color}${lv.name}`);
        }

        player.sendForm(fm, (pl, id) => {
            if (id == null) return;
            this.showChallenges(pl, levels[id].name);
        });
    }

    showChallenges(player, levelName) {

        if (!this.manager.isLevelUnlocked(player.xuid, levelName)) {
            const lv = this.manager.storage.findLevel(levelName);
            const u = lv.unlock;
            player.sendMsg(`§c需要先完成 §e${u.count}§c 个 §e${u.from}§c 等级的挑战`);
            return this.showLevels(player);
        }

        const ids = this.manager.listChallengesInLevel(levelName);
        const fm = mc.newSimpleForm().setTitle(`岛屿任务 - ${levelName}`);

        for (const id of ids) {
            const ch = this.manager.storage.challenges[id];
            const done = this.manager.getCompletedTimes(player.xuid, id);
            const color = done >= ch.maxTimes ? '§a' : (done > 0 ? '§e' : '§c');
            fm.addButton(`${color}${ch.name}`);
        }

        player.sendForm(fm, (pl, idx) => {
            if (idx == null) return this.showLevels(pl);
            this.showDetail(pl, ids[idx], levelName);
        });
    }

    showDetail(player, challengeId, levelName) {

        const ch = this.manager.storage.challenges[challengeId];
        const done = this.manager.getCompletedTimes(player.xuid, challengeId);

        const body = `§e描述: §r${ch.description}\n`
            + `§e奖励: §r${ch.rewardText || describeRewards(ch.rewards)}\n`
            + `§e等级: §r${ch.level}\n`
            + `§e次数: §r${done} / ${ch.maxTimes}`;

        player.sendModalForm(ch.name, body, '提交', '返回', (pl, ok) => {
            if (ok == null) return;
            if (!ok) {
                this.showChallenges(pl, levelName);
                return;
            }
            this.manager.trySubmit(pl, challengeId);
            this.showChallenges(pl, levelName);
        });
    }
}


const storage = new ChallengeStorage(DATA_DIR);
const manager = new ChallengeManager(storage);
const ui = new ChallengeUI(manager);


skyblock.Command.registerAll({
    "challenge": (origin) => ui.showLevels(origin.player),
});


const helpExt = '\n§e/is challenge §7- 查看岛屿挑战';
skyblock.Store.set('help', skyblock.Store.get('help') + helpExt, true);

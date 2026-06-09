/**
 * 岛屿业务服务
 * 约定
 * 所有方法返回 { ok: boolean, code: string, ... }
 * 所有数据修改之后,会通过 EventBus 通知监听者
 */

import { Island as IslandRepo } from "plugins/skyblock/src/repos/IslandRepo.js";
import { Permission as PermRepo } from "plugins/skyblock/src/repos/PermissionRepo.js";
import { Coord } from "plugins/skyblock/src/core/Coord.js";
import { Event } from "plugins/skyblock/src/core/EventBus.js";
import { CONST } from "plugins/skyblock/src/core/constants.js";
import { L } from "plugins/skyblock/src/core/Logger.js";
import { SpatialGrid } from "plugins/skyblock/src/core/SpatialGrid.js";
import { config } from "plugins/skyblock/src/core/Config.js";

const log = L("IslandService");

class IslandService {
    constructor() {
        this._nameCache = new Map();    // islandId -> name
        // 网格大小用
        this.grid = new SpatialGrid(config.get("island").gap);
    }

    /** 启动期把所有岛塞进 SpatialGrid */
    rebuildGrid() {
        this.grid.clear();
        const ranges = IslandRepo.listRanges();
        for (const id in ranges) this.grid.add(id, ranges[id]);
        log.info(`{g}已构建空间索引 {y}${Object.keys(ranges).length} {g}个岛屿`);
    }

    // 查询

    getById(id) { return IslandRepo.get(id); }
    xuid2Id(xuid) { return IslandRepo.getIndex(xuid); }
    getDelCount(xuid) { return IslandRepo.getDelCount(xuid); }
    listAll() { return IslandRepo.listAll(); }
    listByKind(kind = "normal") { return IslandRepo.listByKind(kind); }

    /** 缓存岛屿名 */
    getName(islandId) {
        if (this._nameCache.has(islandId)) return this._nameCache.get(islandId);
        const name = IslandRepo.get(islandId)?.name ?? null;
        if (name) this._nameCache.set(islandId, name);
        return name;
    }

    // 通过坐标找岛屿
    findByPos(pos) {

        // log.info(this.grid.grid)

        // const map = this.grid.grid;

        // for (const [key, value] of map) {
        //     log.info(`Key: ${key}, Value: ${value}`);
        // }
        // const stack = new Error().stack;
        // log.info('query() 被调用，位置参数:', pos);
        // log.info('调用栈:\n', stack);

        // for (const [key, value] of candidates) {
        //     log.info(`Key: ${key}, Value: ${value}`);
        // }

        // log.info(candidates)

        const candidates = this.grid.query(pos);
        for (const id of candidates) {
            const isl = IslandRepo.get(id);
            if (!isl) continue;
            const { min, max } = isl.range;
            if (pos.x >= min[0] && pos.x <= max[0] && pos.z >= min[1] && pos.z <= max[1]) return id;
        }

        return null;
    }

    // 写操作

    /**
     * 创建岛屿
     * @returns {{ok, code, islandId?, spawn?, loadInfo?}}
     */
    create(xuid, ownerName, template) {
        if (IslandRepo.getIndex(xuid)) return { ok: false, code: "already_have" };

        const range = Coord.next();
        const { loadInfo, spawn } = this._placement(template, range.center);

        //
        const islandData = {
            name: ownerName,
            nickname: "",
            owner: xuid,
            range: { min: range.min, max: range.max },
            members: {
                [xuid]: { trustLevel: CONST.TRUST_OWNER, spawn },
            },
        };
        const islandId = IslandRepo.create(islandData);

        IslandRepo.setIndex(xuid, islandId);
        PermRepo.init(islandId);
        this.grid.add(islandId, islandData.range);

        Event.emit("island:created", xuid, islandId, range, template);
        log.info(`{g}新岛屿 {y}${islandId} {g}由 {y}${xuid}{g}/{y}${ownerName}{g} 创建`);
        return { ok: true, code: "ok", islandId, spawn, loadInfo, range };
    }

    /**
     * 解散岛屿
     * @returns {{ok, code, members?}}
     */
    remove(islandId, opts = {}) {
        const { countReset = true } = opts;
        const data = IslandRepo.get(islandId);
        if (!data) return { ok: false, code: "no_island" };

        const owner = data.owner;
        const members = Object.keys(data.members);

        // 自定义岛屿 owner 为 null,跳过删岛计数
        if (countReset && owner) IslandRepo.addDelCount(owner);

        IslandRepo.remove(islandId);
        PermRepo.remove(islandId);
        this.grid.remove(islandId);
        this._nameCache.delete(islandId);

        Event.emit("island:removed", { islandId, owner, members });
        return { ok: true, code: "ok", members };
    }

    addMember(islandId, xuid, trustLevel = CONST.TRUST_MEMBER) {
        const data = IslandRepo.get(islandId);
        if (!data) return { ok: false, code: "no_island" };
        if (data.members[xuid]) return { ok: false, code: "already_member" };
        // 不允许同时是其他岛的成员
        if (IslandRepo.getIndex(xuid)) return { ok: false, code: "in_other_island" };

        data.members[xuid] = {
            trustLevel,
            spawn: data.members[data.owner].spawn,
        };
        IslandRepo.update(islandId, "members", data.members);
        IslandRepo.setIndex(xuid, islandId);

        Event.emit("island:memberJoined", { islandId, xuid });
        return { ok: true, code: "ok" };
    }

    removeMember(islandId, xuid) {
        const data = IslandRepo.get(islandId);
        if (!data) return { ok: false, code: "no_island" };
        if (data.owner === xuid) return { ok: false, code: "is_owner" };
        if (!data.members[xuid]) return { ok: false, code: "not_member" };

        delete data.members[xuid];
        IslandRepo.update(islandId, "members", data.members);
        IslandRepo.removeIndex(xuid);

        Event.emit("island:memberLeft", { islandId, xuid });
        return { ok: true, code: "ok" };
    }

    setSpawn(islandId, xuid, spawn) {
        const data = IslandRepo.get(islandId);
        if (!data || !data.members[xuid]) return { ok: false, code: "not_member" };
        data.members[xuid].spawn = spawn;
        IslandRepo.update(islandId, "members", data.members);
        return { ok: true, code: "ok" };
    }

    rename(islandId, name) {
        const ok = IslandRepo.update(islandId, "name", name);
        if (ok) this._nameCache.delete(islandId);
        return ok ? { ok: true, code: "ok" } : { ok: false, code: "no_island" };
    }

    /** 重置玩家解散次数 */
    resetDelCount(xuid) {
        const ok = IslandRepo.resetDelCount(xuid);
        return ok ? { ok: true, code: "ok" } : { ok: false, code: "no_record" };
    }

    /**
     * 转让岛主
     * 旧岛主 → MEMBER,新岛主 → OWNER,island.name 改为 newOwnerName
     */
    transfer(islandId, newOwnerXuid, newOwnerName) {
        const d = IslandRepo.get(islandId);
        if (!d) return { ok: false, code: "no_island" };
        if (d.owner === newOwnerXuid) return { ok: false, code: "same_owner" };
        if (!d.members[newOwnerXuid]) return { ok: false, code: "not_member" };

        const oldOwner = d.owner;
        d.members[oldOwner].trustLevel = CONST.TRUST_MEMBER;
        d.members[newOwnerXuid].trustLevel = CONST.TRUST_OWNER;
        d.owner = newOwnerXuid;
        if (newOwnerName) d.name = newOwnerName;

        IslandRepo.update(islandId, "members", d.members);
        IslandRepo.update(islandId, "owner", d.owner);
        if (newOwnerName) IslandRepo.update(islandId, "name", d.name);
        this._nameCache.delete(islandId);

        Event.emit("island:transferred", { islandId, oldOwner, newOwner: newOwnerXuid });
        return { ok: true, code: "ok" };
    }

    /**
     * 代理加成员(管理员代理用)
     * 跳过 "已有岛屿" 检查,trustLevel 设为 OWNER,spawn 复制岛主的
     * 不动 index,index 由 AdminProxyService 控制
     */
    addProxyMember(islandId, adminXuid) {
        const d = IslandRepo.get(islandId);
        if (!d) return { ok: false, code: "no_island" };
        if (d.members[adminXuid]) return { ok: false, code: "already_member" };

        // 自定义岛屿:用顶层 d.spawn(owner 为 null,members 为空)
        // 普通岛屿:走 members[owner].spawn
        const ownerSpawn = d.spawn || d.members[d.owner]?.spawn;
        if (!ownerSpawn) return { ok: false, code: "no_owner_spawn" };

        d.members[adminXuid] = {
            trustLevel: CONST.TRUST_OWNER,
            spawn: [...ownerSpawn],
        };
        IslandRepo.update(islandId, "members", d.members);

        Event.emit("island:proxyJoined", { islandId, adminXuid });
        return { ok: true, code: "ok", spawn: ownerSpawn };
    }

    /** 代理删成员(管理员代理退出用) 不动 index */
    removeProxyMember(islandId, adminXuid) {
        const d = IslandRepo.get(islandId);
        if (!d) return { ok: false, code: "no_island" };
        if (!d.members[adminXuid]) return { ok: false, code: "not_member" };

        delete d.members[adminXuid];
        IslandRepo.update(islandId, "members", d.members);

        Event.emit("island:proxyLeft", { islandId, adminXuid });
        return { ok: true, code: "ok" };
    }

    /**
     * 创建自定义岛屿(管理员用)
     *  - owner 设为 null,members 为空(管理员代理时才会加进 members)
     *  - 顶层 spawn 字段记录岛屿出生点(后续可由 setIslandSpawn 修改)
     *  - 不写 setIndex(管理员的普通岛 index 不动)
     */
    createCustom(adminXuid, name, template) {
        const range = Coord.next();
        const { loadInfo, spawn } = this._placement(template, range.center);

        const islandData = {
            name,
            nickname: "",
            owner: null,
            kind: "custom",
            spawn,
            range: { min: range.min, max: range.max },
            members: {},
        };
        const islandId = IslandRepo.create(islandData);
        PermRepo.init(islandId);
        this.grid.add(islandId, islandData.range);

        Event.emit("island:customCreated", adminXuid, islandId, range, template);
        log.info(`{g}新自定义岛屿 {y}${islandId} {g}由 {y}${adminXuid} {g}创建 {y}${name}`);
        return { ok: true, code: "ok", islandId, spawn, loadInfo, range };
    }

    /**
     * 设置岛屿顶层 spawn(自定义岛屿用,管理员后续修改传送点)
     */
    setIslandSpawn(islandId, spawn) {
        const ok = IslandRepo.update(islandId, "spawn", spawn);
        return ok ? { ok: true, code: "ok" } : { ok: false, code: "no_island" };
    }

    /**
     * 调整岛屿大小(以中心点为基准等比扩张/缩小)
     * @param {string} islandId
     * @param {number} newSize 新边长(>= 16)
     */
    resize(islandId, newSize) {
        const d = IslandRepo.get(islandId);
        if (!d) return { ok: false, code: "no_island" };
        if (newSize < 16) return { ok: false, code: "too_small" };

        const oldRange = d.range;
        const cx = Math.floor((oldRange.min[0] + oldRange.max[0]) / 2);
        const cz = Math.floor((oldRange.min[1] + oldRange.max[1]) / 2);
        const half = Math.floor(newSize / 2);
        const newRange = {
            min: [cx - half, cz - half],
            max: [cx - half + newSize - 1, cz - half + newSize - 1],
        };

        // 用新 range 的四个角 + 中心 都查一遍 SpatialGrid,排除自己,AABB 相交
        const probes = [
            { x: cx, z: cz },
            { x: newRange.min[0], z: newRange.min[1] },
            { x: newRange.max[0], z: newRange.min[1] },
            { x: newRange.min[0], z: newRange.max[1] },
            { x: newRange.max[0], z: newRange.max[1] },
        ];
        const seen = new Set();
        for (const p of probes) {
            for (const id of this.grid.query({ ...p, dimid: CONST.DIM_OVERWORLD })) {
                if (id === islandId || seen.has(id)) continue;
                seen.add(id);
                const other = IslandRepo.get(id);
                if (!other) continue;
                if (this._aabbIntersect(newRange, other.range)) {
                    return { ok: false, code: "conflict", conflictId: id };
                }
            }
        }

        IslandRepo.update(islandId, "range", newRange);
        this.grid.remove(islandId);
        this.grid.add(islandId, newRange);

        Event.emit("island:resized", { islandId, oldRange, newRange });
        return { ok: true, code: "ok", newRange };
    }

    /**
     * 由模板和岛屿中心点算出 mcstructure 加载信息与玩家出生点
     * create / createCustom 共用
     */
    _placement(template, center) {
        const { spawnX, spawnY, spawnZ, file, pasteOffset } = template;
        const loadInfo = {
            file,
            loadPosX: center.x - Math.floor(spawnX / 2),
            loadPosY: spawnY,
            loadPosZ: center.z - Math.floor(spawnZ / 2),
        };
        const spawn = [
            center.x - pasteOffset[0],
            spawnY + pasteOffset[1],
            center.z - pasteOffset[2],
            CONST.DIM_OVERWORLD,
        ];
        return { loadInfo, spawn };
    }

    _aabbIntersect(a, b) {
        return !(a.max[0] < b.min[0] || a.min[0] > b.max[0] ||
            a.max[1] < b.min[1] || a.min[1] > b.max[1]);
    }
}

export const IslandSvc = new IslandService();

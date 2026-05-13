/**
 * 管理员代理服务
 *
 * 流程:
 *   enter(adminXuid, targetIslandId):
 *     - 检查未在代理状态
 *     - 检查目标存在 & 不是 admin 自己的岛
 *     - 记录 oldIsland = index[adminXuid]
 *     - addProxyMember + setIndex(adminXuid → target)
 *     - 写 admin_proxy.json
 *
 *   exit(adminXuid):
 *     - 容忍 proxy 岛屿已被删除
 *     - removeProxyMember(若 island 还在)
 *     - setIndex(adminXuid → oldIsland) 或 removeIndex
 *     - 删 admin_proxy 记录
 *
 *   restore() 启动期:
 *     - 对每条 admin_proxy 记录,确保 island/members/index 一致
 */

import { AdminProxy as ProxyRepo } from "plugins/skyblock/src/repos/AdminProxyRepo.js";
import { Island as IslandRepo } from "plugins/skyblock/src/repos/IslandRepo.js";
import { IslandSvc } from "plugins/skyblock/src/services/IslandService.js";
import { Event } from "plugins/skyblock/src/core/EventBus.js";
import { L } from "plugins/skyblock/src/core/Logger.js";

const log = L("AdminProxy");

class AdminProxyService {

    isInProxy(adminXuid) { return ProxyRepo.has(adminXuid); }

    getProxy(adminXuid) { return ProxyRepo.get(adminXuid); }

    /**
     * 进入代理
     * @returns {{ok, code, spawn?, oldIsland?, proxy?}}
     */
    enter(adminXuid, targetIslandId) {
        if (ProxyRepo.has(adminXuid)) {
            const cur = ProxyRepo.get(adminXuid);
            return { ok: false, code: "already_in_proxy", proxy: cur.proxy };
        }
        const target = IslandRepo.get(targetIslandId);
        if (!target) return { ok: false, code: "no_island" };

        const oldIsland = IslandRepo.getIndex(adminXuid) || null;
        if (oldIsland === targetIslandId) return { ok: false, code: "self_island" };
        if (target.owner === adminXuid) return { ok: false, code: "self_island" };

        const r = IslandSvc.addProxyMember(targetIslandId, adminXuid);
        if (!r.ok) return r;

        IslandRepo.setIndex(adminXuid, targetIslandId);
        ProxyRepo.set(adminXuid, oldIsland, targetIslandId);

        Event.emit("admin:proxyEntered", { adminXuid, oldIsland, proxy: targetIslandId });
        log.info(`管理员 ${adminXuid} 进入代理: ${oldIsland ?? "(无岛)"} → ${targetIslandId}`);
        return { ok: true, code: "ok", spawn: r.spawn, oldIsland, proxy: targetIslandId };
    }

    /**
     * 退出代理
     * 容忍 proxy 岛屿已被删除
     * @returns {{ok, code, oldIsland?}}
     */
    exit(adminXuid) {
        const rec = ProxyRepo.get(adminXuid);
        if (!rec) return { ok: false, code: "not_in_proxy" };

        const { oldIsland, proxy } = rec;
        if (proxy && IslandRepo.get(proxy)) {
            IslandSvc.removeProxyMember(proxy, adminXuid);
        }

        if (oldIsland && IslandRepo.get(oldIsland)) {
            IslandRepo.setIndex(adminXuid, oldIsland);
        } else {
            IslandRepo.removeIndex(adminXuid);
        }

        ProxyRepo.remove(adminXuid);

        Event.emit("admin:proxyExited", { adminXuid, oldIsland, proxy });
        log.info(`管理员 ${adminXuid} 退出代理: ${proxy} → ${oldIsland ?? "(无岛)"}`);
        return { ok: true, code: "ok", oldIsland };
    }

    /**
     * 启动期恢复:对每条 admin_proxy 记录确保数据一致
     *  - proxy 岛屿存在:补齐 members + index
     *  - proxy 岛屿不存在:走 exit 流程兜底
     */
    restore() {
        const all = ProxyRepo.listAll();
        let n = 0;
        for (const adminXuid in all) {
            const rec = all[adminXuid];
            const proxyIsland = rec.proxy ? IslandRepo.get(rec.proxy) : null;

            if (!proxyIsland) {
                // 被代理岛已经没了,清记录 + 把 index 还给 oldIsland
                if (rec.oldIsland && IslandRepo.get(rec.oldIsland)) {
                    IslandRepo.setIndex(adminXuid, rec.oldIsland);
                } else {
                    IslandRepo.removeIndex(adminXuid);
                }
                ProxyRepo.remove(adminXuid);
                log.warn(`恢复时发现代理岛屿已不存在: admin=${adminXuid}, proxy=${rec.proxy} -> 已自动 exit`);
                continue;
            }

            // 确保 admin 是 proxy 岛的 members
            if (!proxyIsland.members[adminXuid]) {
                IslandSvc.addProxyMember(rec.proxy, adminXuid);
            }
            // 确保 index 指向 proxy
            if (IslandRepo.getIndex(adminXuid) !== rec.proxy) {
                IslandRepo.setIndex(adminXuid, rec.proxy);
            }
            n++;
        }
        if (n > 0) log.info(`{g}已恢复 {y}${n}{g} 个管理员代理状态`);
    }
}

export const AdminProxySvc = new AdminProxyService();

/**
 * 事件总线
 *
 *  guard / check 守卫(权限类),任意 fn 返回 true 即放行
 *  on / emit    通知(广播类),不关心返回值,异常隔离
 *
 */

import { L } from "plugins/skyblock/src/core/Logger.js";

const log = L("EventBus");

class EventBus {
    constructor() {
        this.guards = {};   // name -> [fn, fn, ...]
        this.hooks = {};   // name -> [fn, fn, ...]
    }

    // ────────────────────────────────────────
    //   guard 用于权限检查
    //   任意一个 fn 返回 true 即放行(白名单语义)
    //   没有任何 guard 注册时,默认放行(true)
    // ────────────────────────────────────────

    /** 注册一个守卫 */
    guard(name, fn) {
        if (typeof fn !== "function") return;
        (this.guards[name] ??= []).push(fn);
    }

    /** 触发守卫,得到 boolean */
    check(name, ...args) {
        const list = this.guards[name];
        if (!list || list.length === 0) return true;
        for (const fn of list) {
            try {
                if (fn(...args) === true) return true;
            } catch (e) {
                log.error(`guard "${name}" 抛错:`, e);
            }
        }
        return false;
    }

    // ────────────────────────────────────────
    //   通知(hook):用于广播事件
    //   所有监听都会被调用,异常单独捕获,不返回值
    // ────────────────────────────────────────

    /** 注册一个监听 */
    on(name, fn) {
        if (typeof fn !== "function") return;
        (this.hooks[name] ??= []).push(fn);
    }

    /** 触发通知 */
    emit(name, ...args) {
        const list = this.hooks[name];
        if (!list) return;
        for (const fn of list) {
            try { fn(...args); }
            catch (e) { log.error(`hook "${name}" 抛错:`, e); }
        }
    }

    // ────────────────────────────────────────
    // 兼容 API(可选)
    // ────────────────────────────────────────

    /** @deprecated 用 guard / on */
    listen(name, fn) { this.guard(name, fn); this.on(name, fn); }
}

export const Event = new EventBus();

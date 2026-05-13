/**
 * 共享 KV 存储
 *
 * 给第三方插件用来挂数据 / 注册函数,内部不依赖
 *
 */

import { L } from "plugins/skyblock/src/core/Logger.js";
const log = L("Store");

class StoreManage {
    constructor() {
        this._data = new Map();
        this._fns = new Map();
    }

    /**
     * 设置值,默认拒绝覆盖
     * @param {string} key
     * @param {*} value
     * @param {boolean} force 强制覆盖
     */
    set(key, value, force = false) {
        if (this._data.has(key) && !force) {
            log.warn(`set: key "${key}" 已存在,本次写入被忽略(传 force=true 强制覆盖)`);
            return false;
        }
        this._data.set(key, value);
        return true;
    }

    get(key) { return this._data.get(key); }

    has(key) { return this._data.has(key) || this._fns.has(key); }

    /** 注册可调用函数 */
    register(name, fn, force = false) {
        if (this._fns.has(name) && !force) {
            log.warn(`register: name "${name}" 已存在,本次注册被忽略`);
            return false;
        }
        this._fns.set(name, fn);
        return true;
    }

    /** 调用已注册的函数 */
    call(name, ...args) {
        const fn = this._fns.get(name);
        if (!fn) return undefined;
        try { return fn(...args); }
        catch (e) { log.error(`call "${name}" 抛错:`, e); return undefined; }
    }
}

export const Store = new StoreManage();

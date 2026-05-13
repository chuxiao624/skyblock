/**
 * 持久化抽象层
 *
 */

import { CONST } from "plugins/skyblock/src/core/constants.js";

export class Storage {
    /**
     * @param {string} path 文件路径
     * @param {string} defaultJson 默认 JSON 串
     */
    constructor(path, defaultJson = "{}") {
        this.path = path;
        this.file = new JsonConfigFile(path, defaultJson);
        this._dirty = new Set();
        this._timer = null;
    }

    /** 取已有值,没有就用 def 初始化 */
    init(key, def) { return this.file.init(key, def); }

    /** 直接读取 */
    get(key) { return this.file.get(key); }

    /** 是否包含 */
    has(key) { return this.file.get(key) !== undefined; }

    /** 写入 */
    set(key, value) {
        this.file.set(key, value);
        this._scheduleFlush();
    }

    /** 同步刷盘 */
    _scheduleFlush() {
        // JsonConfigFile.set 保留一个钩子供未来切换
        if (this._timer) return;
        this._timer = setTimeout(() => {
            this._timer = null;
            this._dirty.clear();
        }, CONST.STORAGE_FLUSH_MS);
    }

    /** 读取整个文件并解析 */
    readAll() {
        try {
            return JSON.parse(this.file.read() || "{}");
        } catch (e) {
            return {};
        }
    }
}

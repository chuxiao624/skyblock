/**
 * 会话/确认/邀请管理器
 *
 * 用法:
 *   Session.set("invite", targetXuid, ownerXuid, 30);
 *   Session.set("disband", playerXuid, islandId, 30);
 *   if (Session.has("invite", xuid)) ...
 *   const inviter = Session.get("invite", xuid);
 *   Session.del("invite", xuid);
 *
 * 每个条目都自带过期定时器,到期自动清理
 */

class SessionManager {
    constructor() {
        // namespace -> Map<key, { value, timer }>
        this._ns = new Map();
    }

    _bucket(namespace) {
        let b = this._ns.get(namespace);
        if (!b) { b = new Map(); this._ns.set(namespace, b); }
        return b;
    }

    /**
     * 写入一个会话项,如果同 key 已存在,先清除旧定时器再覆盖
     * @param {string} namespace
     * @param {string} key
     * @param {*} value
     * @param {number} ttlSec 过期秒数
     */
    set(namespace, key, value, ttlSec) {
        const bucket = this._bucket(namespace);
        const old = bucket.get(key);
        if (old) clearInterval(old.timer);

        const timer = setTimeout(() => bucket.delete(key), ttlSec * 1000);
        bucket.set(key, { value, timer });
    }

    get(namespace, key) {
        return this._bucket(namespace).get(key)?.value;
    }

    has(namespace, key) {
        return this._bucket(namespace).has(key);
    }

    del(namespace, key) {
        const bucket = this._bucket(namespace);
        const old = bucket.get(key);
        if (old) {
            clearInterval(old.timer);
            bucket.delete(key);
        }
    }

    /** 清空整个 namespace */
    clearNamespace(namespace) {
        const bucket = this._ns.get(namespace);
        if (!bucket) return;
        for (const { timer } of bucket.values()) clearInterval(timer);
        bucket.clear();
    }
}

export const Session = new SessionManager();

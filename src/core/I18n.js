/**
 * 语言文件
 *
 */

import { config } from "plugins/skyblock/src/core/Config.js";
import { PATHS } from "plugins/skyblock/src/core/paths.js";
import { L } from "plugins/skyblock/src/core/Logger.js";

const log = L("I18n");

class I18n {
    constructor() {
        // { langCode: { key: value } }
        this._store = {};
        this._lang = config.get("lang") || "zh_CN";
        this._loadFromFile(this._lang);
    }

    /** 从 lang/<lang>.json 读取并合并到 _store[lang] */
    _loadFromFile(lang) {
        try {
            const path = `${PATHS.LANG_DIR}/${lang}.json`;
            const file = new JsonConfigFile(path, "{}");
            const content = JSON.parse(file.read() || "{}");
            this._store[lang] = { ...(this._store[lang] || {}), ...content };
        } catch (e) {
            log.error(`加载语言 ${lang} 失败:`, e);
            this._store[lang] = this._store[lang] || {};
        }
    }

    /**
     * 第三方扩展热注册语言包
     * @param {string} lang
     * @param {Record<string,string>} messages
     */
    register(lang, messages) {
        if (!this._store[lang]) this._store[lang] = {};
        Object.assign(this._store[lang], messages);
    }

    /** 切语言 */
    setLang(lang) {
        if (!this._store[lang]) this._loadFromFile(lang);
        this._lang = lang;
        config.set("lang", lang);
    }

    getLang() { return this._lang; }

    /**
     * 翻译
     * @param {string} key
     * @param {Record<string,*>} vars 占位符  {chuxiao}
     */
    tr(key, vars = {}) {
        const messages = this._store[this._lang] || {};
        const tpl = messages[key];
        if (typeof tpl !== "string") return key;
        return tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
    }
}

export const i18n = new I18n();

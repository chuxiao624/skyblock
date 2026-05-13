/**
 * 统一日志
 *   import { L } from "plugins/skyblock/src/core/Logger.js";
 *   const log = L("IslandService");
 *   log.info("玩家创岛", xuid);
 *
 */


class Logger {
    constructor(tag) {
        this.tag = tag;
        this._debugEnabled = false;

        this.C = {
            reset: "\x1b[0m",
            gray: "\x1b[90m",
            red: "\x1b[31m",
            green: "\x1b[32m",
            yellow: "\x1b[33m",
            cyan: "\x1b[36m",
            bold: "\x1b[1m",
        };
    }

    setDebug(v) {
        this._debugEnabled = !!v;
    }
    _parse(str) {
        const C = this.C;

        return String(str)
            .replace(/\{gray\}/g, C.gray)
            .replace(/\{\/gray\}/g, C.reset)

            .replace(/\{r\}/g, C.red)
            .replace(/\{\/r\}/g, C.reset)

            .replace(/\{g\}/g, C.green)
            .replace(/\{\/g\}/g, C.reset)

            .replace(/\{y\}/g, C.yellow)
            .replace(/\{\/y\}/g, C.reset)

            .replace(/\{c\}/g, C.cyan)
            .replace(/\{\/c\}/g, C.reset)

            .replace(/\{b\}/g, C.bold)
            .replace(/\{\/b\}/g, C.reset);
    }

    _fmt(args) {

        const head = `${this.tag} => `

        return [head, ...args];
    }

    _fmtInfo(args = []) {

        const head = this._parse(`{c}${this.tag}{/c} {gray}=>{/gray} `);

        const newInfo = args.map(str => this._parse(str));

        return [head, ...newInfo];
    }

    info(...args) {
        logger.info(...this._fmtInfo(args));
    }

    warn(...args) {
        logger.warn(...this._fmt(args));
    }

    error(...args) {
        logger.error(...this._fmt(args));
    }

    debug(...args) {
        if (this._debugEnabled) {
            logger.info(...this._fmt(args));
        }
    }
}

export function L(tag) {
    return new Logger(tag);
}
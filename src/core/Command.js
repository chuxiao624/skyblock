/**
 * 命令注册器
 *
 *   Command.registerAll({
 *     "create": (origin) => { ... },               // 简写
 *     "warp": {
 *       enums:    { warp_action: ["list","public","toggle"] },
 *       params:   { warp_name: { type: ParamType.String, optional: true } },
 *       overloads:[ ["warp_action"], ["warp_action","warp_name"] ],
 *       callback: (origin, output, results) => { ... }
 *     }
 *   });
 *
 * 服务器启动后由 skyblock.js 统一调用 Command.setup()
 */

import { L } from "plugins/skyblock/src/core/Logger.js";

const log = L("Command");

class CommandRegistry {
    constructor() {
        this._registry = {};
        this.runIs = null;       // /is 不带子命令时执行
        this._setup = false;
    }

    /**
     * 批量注册子命令
     */
    registerAll(map) {
        if (this._setup) {
            log.warn("setup() 已调用,后续 registerAll 不会生效。请提前注册");
        }
        for (const name in map) {
            if (this._registry[name]) {
                log.warn(`子命令 "${name}" 已注册,跳过`);
                continue;
            }
            const value = map[name];
            if (typeof value === "function") {
                this._registry[name] = {
                    enums: {}, params: {}, overloads: [[]], callback: value,
                };
            } else if (typeof value === "object" && value) {
                this._registry[name] = {
                    enums: value.enums || {},
                    params: value.params || {},
                    overloads: value.overloads || [[]],
                    callback: value.callback,
                };
            }
        }
    }

    /* 注册指令 */
    setup() {
        if (this._setup) return;
        this._setup = true;

        const cmd = mc.newCommand("is", "SkyBlock Command", PermType.Any);
        const callbackMap = {};

        for (const subName in this._registry) {
            const sub = this._registry[subName];

            // 子命令本身的枚举
            cmd.setEnum(subName, [subName]);
            cmd.mandatory(subName, ParamType.Enum, subName, subName, 1);

            // 子命令声明的枚举
            for (const enumName in sub.enums) {
                cmd.setEnum(enumName, sub.enums[enumName]);
                cmd.mandatory(enumName, ParamType.Enum, enumName, enumName, 1);
            }

            // 子命令声明的普通参数
            for (const paramName in sub.params) {
                const v = sub.params[paramName];
                if (typeof v === "object" && v) {
                    if (v.optional) cmd.optional(paramName, v.type);
                    else cmd.mandatory(paramName, v.type);
                } else {
                    cmd.mandatory(paramName, v);
                }
            }

            // 重载,前面自动塞子命令枚举
            for (const overload of sub.overloads) {
                cmd.overload([subName, ...overload]);
            }

            callbackMap[subName] = sub.callback;
        }

        // /is 不带任何子命令
        cmd.overload([]);

        cmd.setCallback((_cmd, origin, output, results) => {
            for (const subName in this._registry) {
                if (results[subName] !== undefined) {
                    const cb = callbackMap[subName];
                    try {
                        if (typeof cb === "function") cb(origin, output, results);
                    } catch (e) {
                        log.error(`子命令 "${subName}" 执行抛错:`, e);
                    }
                    return;
                }
            }
            // 没匹配到子命令
            try {
                if (typeof this.runIs == "function") this.runIs(origin, output, results);
            } catch (e) {
                log.error("runIs 抛错:", e);
            }
        });

        cmd.setup();
    }
}

export const Command = new CommandRegistry();

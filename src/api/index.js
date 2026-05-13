/**
 * API 入口
 * 把所有对外稳定接口挂到 globalThis.skyblock
 *
 * 第三方插件按这个命名空间引用:
 *   skyblock.island.createIsland(...)
 *   skyblock.Event.on(...)
 *   skyblock.Command.registerAll(...)
 */

import { Event } from "plugins/skyblock/src/core/EventBus.js";
import { Store } from "plugins/skyblock/src/core/Store.js";
import { Session } from "plugins/skyblock/src/core/Session.js";
import { Timer } from "plugins/skyblock/src/core/Timer.js";
import { Command } from "plugins/skyblock/src/core/Command.js";
import { config } from "plugins/skyblock/src/core/Config.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";

import { island } from "plugins/skyblock/src/api/island.js";
import { perms } from "plugins/skyblock/src/api/perms.js";
import { protect } from "plugins/skyblock/src/api/protect.js";

import { Tracker } from "plugins/skyblock/src/services/TrackerService.js";

globalThis.skyblock = globalThis.skyblock || {};

skyblock.Event = Event;
skyblock.Store = Store;
skyblock.Session = Session;
skyblock.Timer = Timer;
skyblock.Command = Command;
skyblock.config = config;
skyblock.i18n = i18n;
skyblock.island = island;
skyblock.perms = perms;
skyblock.protect = protect;
skyblock.Tracker = Tracker;

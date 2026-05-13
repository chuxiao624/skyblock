/**
 * 玩家位置追踪
 */

import { Tracker } from "plugins/skyblock/src/services/TrackerService.js";
import { CONST } from "plugins/skyblock/src/core/constants.js";

mc.listen("onLeft", (player) => {
    Tracker.onLeft(player);
});

setInterval(() => Tracker.tick(), CONST.TRACKER_INTERVAL_MS);

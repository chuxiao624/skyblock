
import { Command } from "plugins/skyblock/src/core/Command.js";
import { Store } from "plugins/skyblock/src/core/Store.js";
import { openListGui, openPublicGui, openToggleGui } from "plugins/skyblock/src/modules/warp/gui.js";

Command.registerAll({
    "warp": {
        enums: { warp_action: ["list", "public", "toggle"] },
        overloads: [["warp_action"]],
        callback: (origin, output, results) => {
            const p = origin.player; if (!p) return;
            switch (results.warp_action) {
                case "list": return openListGui(p);
                case "public": return openPublicGui(p);
                case "toggle": return openToggleGui(p);
            }
        }
    }
});

// 帮助补充
const ext = "\n§e/is warp list §7- 自家传送点\n§e/is warp public §7- 浏览公开传送点\n§e/is warp toggle §7- 切换公开/私有";

Store.set("help", Store.get("help") + ext, true);
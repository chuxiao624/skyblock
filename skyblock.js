/**
 * skyblock 入口
 *
 * 依赖关系:
 *   core 基础设施 → repos 数据 → services 业务 → api 对外 → modules 内置功能
 *   服务器启动后:加载第三方扩展 → setup 命令 → 重建空间索引
 */

// 1. API 装配:把所有对外接口挂到 globalThis.skyblock
import "plugins/skyblock/src/api/index.js";

// 2. LLSE_Player 扩展
import "plugins/skyblock/src/api/player.js";

// 3. 内置功能模块
import "plugins/skyblock/src/modules/protection/index.js";
import "plugins/skyblock/src/modules/commands/index.js";
import "plugins/skyblock/src/modules/warp/index.js";
import "plugins/skyblock/src/modules/tracker.js";
import "plugins/skyblock/src/modules/nether.js";

// 4. 资源加载
import { loadStructures, loadPlugins } from "plugins/skyblock/src/core/Bootstrap.js";
import { IslandSvc } from "plugins/skyblock/src/services/IslandService.js";
import { AdminProxySvc } from "plugins/skyblock/src/services/AdminProxyService.js";
import { setupAdminCommand } from "plugins/skyblock/src/modules/admin/index.js";
import { setupTemplateEditorCommand } from "plugins/skyblock/src/modules/template-editor/index.js";
import { L } from "plugins/skyblock/src/core/Logger.js";

const log = L("Boot");

// 加载岛屿模板
loadStructures();

// 加载第三方插件 注册命令
mc.listen("onServerStarted", () => {
    try {
        loadPlugins();
    } catch (e) {
        log.error("加载第三方插件失败:", e);
    }

    // 重建空间索引
    IslandSvc.rebuildGrid();

    // 恢复管理员代理状态(必须在 rebuildGrid 之后)
    try {
        AdminProxySvc.restore();
    } catch (e) {
        log.error("恢复代理状态失败:", e);
    }

    // 命令统一注册
    skyblock.Command.setup();
    setupAdminCommand();
    setupTemplateEditorCommand();

    log.info("{g} skyblock 已就绪 !{/g} ");

});


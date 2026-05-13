import { PATHS } from "plugins/skyblock/src/core/paths.js";
import { L } from "plugins/skyblock/src/core/Logger.js";

const log = L("Bootstrap");

/**
 * 把 templates/ 下的 .mcstructure 文件同步到 BDS 的 structures 目录
 */
export function loadStructures() {
    try {
        const sourceFolder = "./" + PATHS.TEMPLATES_DIR;
        const targetFolder = "./" + PATHS.BDS_STRUCTURES;

        const sourceFiles = File.getFilesList(sourceFolder) || [];
        const targetFiles = File.getFilesList(targetFolder) || [];

        let copied = 0;
        for (const item of sourceFiles) {
            if (!item.endsWith(".mcstructure")) continue;
            if (targetFiles.includes(item)) continue;

            file.copy(`${sourceFolder}/${item}`, targetFolder);
            copied++;
        }
        if (copied > 0) log.info(`已同步 ${copied} 个 .mcstructure 模板`);
    } catch (e) {
        log.error("同步模板失败:", e);
    }
}

/**
 * 加载 plugins/skyblock/plugins/ 下的所有 .js 扩展
 */
export function loadPlugins() {
    let count = 0;
    try {
        const list = File.getFilesList("./" + PATHS.PLUGINS_DIR) || [];
        for (const name of list) {
            try {
                if (name.endsWith(".js")) {
                    require(`./skyblock/plugins/${name}`);
                    count++;
                }
            } catch (e) {
                log.error(`加载插件 ${name} 失败:`, e);
            }
        }
    } catch (e) {
        log.error("枚举插件目录失败:", e);
    }

    log.info(`{g}已加载 {y}${count} {g}个扩展`);

    return count;
}

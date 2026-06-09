/**
 * 路径单点维护
 */

const ROOT = "plugins/skyblock";

export const PATHS = {
    ROOT,

    // 配置(提交进 git 作示例)
    CONFIG: `${ROOT}/config/config.json`,
    PERMS_CONFIG: `${ROOT}/config/permissions.json`,

    // 数据(运行时生成,不进 git)
    ISLANDS: `${ROOT}/data/islands.json`,
    INDEX: `${ROOT}/data/index.json`,
    COORD: `${ROOT}/data/coord.json`,
    WARPS: `${ROOT}/data/warps.json`,
    PERMS: `${ROOT}/data/permissions.json`,
    ADMIN_PROXY: `${ROOT}/data/admin_proxy.json`,

    // 资源
    LANG_DIR: `${ROOT}/lang`,
    TEMPLATES_DIR: `${ROOT}/templates`,
    PLUGINS_DIR: `${ROOT}/plugins`,

    // 游戏端
    BDS_STRUCTURES: "behavior_packs/vanilla/structures",
};

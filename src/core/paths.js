/**
 * 路径单点维护
 */

const ROOT = "plugins/skyblock";

export const PATHS = {
    ROOT,

    // 配置
    CONFIG: `${ROOT}/runtime/config/config.json`,
    PERMS_CONFIG: `${ROOT}/runtime/config/permissions.json`,

    // 数据
    ISLANDS: `${ROOT}/runtime/islands.json`,
    INDEX: `${ROOT}/runtime/index.json`,
    COORD: `${ROOT}/runtime/coord.json`,
    WARPS: `${ROOT}/runtime/warps.json`,
    PERMS: `${ROOT}/runtime/permissions.json`,
    ADMIN_PROXY: `${ROOT}/runtime/admin_proxy.json`,

    // 资源
    LANG_DIR: `${ROOT}/lang`,
    TEMPLATES_DIR: `${ROOT}/templates`,
    PLUGINS_DIR: `${ROOT}/plugins`,

    // 游戏端
    BDS_STRUCTURES: "behavior_packs/vanilla/structures",
};

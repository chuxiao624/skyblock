import { defineConfig } from "vitepress";

export default defineConfig({
    title: "skyblock",
    description: "基于 LSE-QuickJS 的基岩版空岛插件文档",
    lang: "zh-CN",
    lastUpdated: true,
    cleanUrls: true,
    head: [
        ['link', { rel: 'icon', href: '/sk_01.png' }]
    ],

    themeConfig: {
        logo: { src: '/sk_01.png', width: 24, height: 24 },
        nav: [
            { text: "介绍", link: "/guide/introduction" },
            { text: "腐竹指南", link: "/server/installation" },
            { text: "玩家指南", link: "/player/getting-started" },
            { text: "开发者指南", link: "/developer/overview" },
        ],

        sidebar: {
            "/guide/": [
                {
                    text: "开始",
                    items: [
                        { text: "项目介绍", link: "/guide/introduction" },
                        { text: "功能特性", link: "/guide/features" },
                    ],
                },
            ],

            "/server/": [
                {
                    text: "部署与配置",
                    items: [
                        { text: "指令一览", link: "/server/commands" },
                        { text: "安装", link: "/server/installation" },
                        { text: "全局配置", link: "/server/configuration" },
                        { text: "全局保护策略", link: "/server/permissions-config" },
                        { text: "多语言", link: "/server/language" },
                    ],
                },
                {
                    text: "岛屿模板",
                    items: [
                        { text: "模板概念", link: "/server/templates" },
                        { text: "创建自定义模板", link: "/server/template-editor" },
                    ],
                },
                {
                    text: "岛屿管理",
                    items: [
                        { text: "管理员命令 /isa", link: "/server/admin-commands" },
                        { text: "自定义岛屿", link: "/server/custom-islands" },
                        { text: "管理员代理 sudo", link: "/server/sudo" },
                    ],
                },
                {
                    text: "扩展玩法",
                    items: [
                        { text: "岛屿挑战配置", link: "/server/challenges" },
                        { text: "岛屿等级配置", link: "/server/level" },
                    ],
                },
                {
                    text: "其他",
                    items: [
                        { text: "故障排查", link: "/server/troubleshooting" },
                    ],
                },
            ],

            "/player/": [
                {
                    text: "新手入门",
                    items: [
                        { text: "快速开始", link: "/player/getting-started" },
                        { text: "命令速查", link: "/player/commands" },
                    ],
                },
                {
                    text: "经营你的岛屿",
                    items: [
                        { text: "岛屿管理", link: "/player/island-management" },
                        { text: "邀请与成员", link: "/player/members" },
                        { text: "传送点 (Warp)", link: "/player/warp" },
                        { text: "权限管理", link: "/player/permissions" },
                    ],
                },
                {
                    text: "进阶玩法",
                    items: [
                        { text: "下界岛屿", link: "/player/nether" },
                        { text: "岛屿挑战", link: "/player/challenges" },
                        { text: "岛屿等级", link: "/player/level" },
                    ],
                },
            ],

            "/developer/": [
                {
                    text: "概览",
                    items: [
                        { text: "架构总览", link: "/developer/overview" },
                        { text: "写一个扩展插件", link: "/developer/plugin-anatomy" },
                        { text: "启动生命周期", link: "/developer/lifecycle" },
                    ],
                },
                {
                    text: "API 参考",
                    items: [
                        { text: "globalThis.skyblock", link: "/developer/globals" },
                        { text: "skyblock.island", link: "/developer/api-island" },
                        { text: "skyblock.perms", link: "/developer/api-perms" },
                        { text: "skyblock.protect", link: "/developer/api-protect" },
                        { text: "skyblock.Command", link: "/developer/api-command" },
                        { text: "skyblock.Event", link: "/developer/api-event" },
                        { text: "skyblock.Store", link: "/developer/api-store" },
                        { text: "skyblock.Session", link: "/developer/api-session" },
                        { text: "skyblock.Timer", link: "/developer/api-timer" },
                        { text: "skyblock.i18n", link: "/developer/api-i18n" },
                        { text: "LLSE_Player 扩展", link: "/developer/api-player" },
                    ],
                },
                {
                    text: "参考表",
                    items: [
                        { text: "权限节点表", link: "/developer/permission-nodes" },
                        { text: "事件清单", link: "/developer/events" },
                        { text: "常量 / 路径", link: "/developer/constants" },
                        { text: "数据文件结构", link: "/developer/data-model" },
                    ],
                },
                {
                    text: "实战",
                    items: [
                        { text: "注册新的子命令", link: "/developer/cookbook-subcommand" },
                        { text: "自定义保护规则", link: "/developer/cookbook-protection" },
                        { text: "跨插件通信", link: "/developer/cookbook-store" },
                    ],
                },
            ],
        },

        socialLinks: [
            { icon: "github", link: "https://github.com/" },
        ],

        outline: { level: [2, 3], label: "本页导航" },

        docFooter: {
            prev: "上一篇",
            next: "下一篇",
        },

        lastUpdatedText: "最后更新",

        search: { provider: "local" },
    },
});

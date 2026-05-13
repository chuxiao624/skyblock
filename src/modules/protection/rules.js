/**
 * 物品 / 方块 → 权限节点 映射表
 *
 * 集中维护 方便 新加方块/物品 
 */

// 模糊匹配(后缀)
export const REGEX = {
    TOOL: /(_shovel|_hoe|_axe)$/,
    SIGN: /_sign$|standing_sign$/,
    FURNACE: /furnace$|smoker$/,
    CONTAINER: /(chest|shulker_box)$/,
    ANVIL: /anvil$/,
    DOOR: /door$|fence_gate$|trapdoor$/,
    BUCKET: /(^minecraft:bucket$)|_bucket$/,   // 空桶
};

// 物品精确匹配 -> 权限节点
export const ITEM_PERMS = new Map([
    ["minecraft:oak_boat", "place_boat"],
    ["minecraft:birch_boat", "place_boat"],
    ["minecraft:spruce_boat", "place_boat"],
    ["minecraft:jungle_boat", "place_boat"],
    ["minecraft:acacia_boat", "place_boat"],
    ["minecraft:dark_oak_boat", "place_boat"],
    ["minecraft:cherry_boat", "place_boat"],
    ["minecraft:mangrove_boat", "place_boat"],
    ["minecraft:bamboo_raft", "place_boat"],
    ["minecraft:minecart", "place_minecart"],
    ["minecraft:hopper_minecart", "place_minecart"],
    ["minecraft:chest_minecart", "place_minecart"],
    ["minecraft:tnt_minecart", "place_minecart"],
    ["minecraft:command_block_minecart", "place_minecart"],
    ["minecraft:bone_meal", "use_bone_meal"],
]);

// 方块精确匹配 -> 权限节点
export const BLOCK_PERMS = new Map([
    ["minecraft:wooden_button", "use_button"],
    ["minecraft:lever", "use_lever"],
    ["minecraft:jukebox", "use_jukebox"],
    ["minecraft:noteblock", "use_noteblock"],
    ["minecraft:cake", "use_cake"],
    ["minecraft:unpowered_comparator", "use_comparator"],
    ["minecraft:powered_comparator", "use_comparator"],
    ["minecraft:unpowered_repeater", "use_repeater"],
    ["minecraft:powered_repeater", "use_repeater"],
    ["minecraft:lectern", "use_lectern"],
    ["minecraft:respawn_anchor", "use_respawn_anchor"],
    ["minecraft:stonecutter_block", "use_workbench"],
    ["minecraft:grindstone", "use_workbench"],
    ["minecraft:cartography_table", "use_workbench"],
    ["minecraft:crafter", "use_workbench"],
    ["minecraft:loom", "use_workbench"],
    ["minecraft:smithing_table", "use_workbench"],
    ["minecraft:brewing_stand", "use_workbench"],
    ["minecraft:crafting_table", "use_crafting_table"],
    ["minecraft:enchanting_table", "use_enchanting_table"],
    ["minecraft:barrel", "use_barrel"],
    ["minecraft:chiseled_bookshelf", "use_bookshelf"],
    ["minecraft:hopper", "use_hopper"],
    ["minecraft:dispenser", "use_dispenser"],
    ["minecraft:dropper", "use_dropper"],
    ["minecraft:beacon", "use_beacon"],
    ["minecraft:bed", "use_bed"],
]);

// 友好生物列表
export const FRIENDLY_MOBS = new Set([
    "minecraft:ocelot", "minecraft:cat", "minecraft:polar_bear", "minecraft:wolf",
    "minecraft:sheep", "minecraft:pig", "minecraft:cow", "minecraft:bee", "minecraft:chicken",
    "minecraft:mooshroom", "minecraft:parrot", "minecraft:rabbit", "minecraft:llama", "minecraft:horse",
    "minecraft:donkey", "minecraft:mule", "minecraft:tropicalfish",
    "minecraft:cod", "minecraft:pufferfish", "minecraft:salmon", "minecraft:dolphin", "minecraft:turtle",
    "minecraft:panda", "minecraft:fox", "minecraft:squid", "minecraft:glow_squid", "minecraft:trader_llama",
    "minecraft:tadpole", "minecraft:frog", "minecraft:allay", "minecraft:axolotl", "minecraft:goat",
    "minecraft:wandering_trader", "minecraft:villager_v2", "minecraft:villager",
    "minecraft:camel", "minecraft:sniffer", "minecraft:armadillo",
]);

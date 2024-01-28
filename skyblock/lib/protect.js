// destroy_block
mc.listen("onDestroyBlock", (player, block) => {

    return skyblock.Event.$emit('onDestroyBlock', [player, block]);

})



// place_block  
mc.listen("onPlaceBlock", (player, block) => {

    return skyblock.Event.$emit('onPlaceBlock', [player, block]);

})


// attack_entity
mc.listen("onAttackEntity", (player, entity) => {

    return skyblock.Event.$emit('onAttackEntity', [player, entity]);

})

// use_item
mc.listen("onUseItem", (player, item) => {

    return skyblock.Event.$emit('onUseItem', [player, item]);

})



// take_item
mc.listen("onTakeItem", (player, entity, item) => {

    return skyblock.Event.$emit('onTakeItem', [player, entity, item]);

})


// drop_item
mc.listen("onDropItem", (player, item) => {

    return skyblock.Event.$emit('onDropItem', [player, item]);

})


// open_container
mc.listen("onOpenContainer", (player, block) => {

    return skyblock.Event.$emit('onOpenContainer', [player, block]);

})



mc.listen("onChangeArmorStand", (as, player) => {

    return skyblock.Protect.InterceptEvent(player, as.pos, "allow_use_armorstand")

})

mc.listen("onUseFrameBlock", (player) => {
    // 展示框
    return skyblock.Protect.InterceptEvent(player, player.pos, "allow_use_frameblock");

})


// 告示牌
mc.listen("onUseItemOn", (player, item, block) => {

    // 使用 锹 锄 斧
    if (item.type?.includes("_shovel") || item.type?.includes("_hoe") || item.type?.includes("_axe")) {

        return skyblock.Protect.InterceptEvent(player, block.pos, "allow_use_tools");

    }


    if (block.type?.includes("wall_sign") || block.type?.includes("hanging_sign")) {

        return skyblock.Protect.InterceptEvent(player, block.pos, "allow_use_wall_sign");

    }

})


mc.listen("onEntityExplode", (source, pos) => {

    return skyblock.Protect.InterceptIslandEvent(pos, "onEntityExplode");

})


mc.listen("onWitherBossDestroy", (witherBoss) => {

    return skyblock.Protect.InterceptIslandEvent(witherBoss.pos, "onWitherBossDestroy");

})

mc.listen("onFireSpread", (pos) => {

    return skyblock.Protect.InterceptIslandEvent(pos, "onFireSpread");

})

mc.listen("onBlockExplode", (source, pos) => {

    return skyblock.Protect.InterceptIslandEvent(pos, "onBlockExplode");

})


mc.listen("onRespawnAnchorExplode", (pos) => {

    return skyblock.Protect.InterceptIslandEvent(pos, "onRespawnAnchorExplode");

})


mc.listen("onFarmLandDecay", (pos) => {

    return skyblock.Protect.InterceptIslandEvent(pos, "onFarmLandDecay");

})



// skyblock.Event.listen("onPlaceBlock", (player, block) => {


//     if (player.getHand().type == "minecraft:glass") {

//         return skyblock.Protect.InterceptEvent(player, block.pos, 'place_block123')

//     }


// })



// 代理拦截事件

// skyblock.Event.listen("onDestroyBlock", (player, block) => {

//     if (block.type == "minecraft:glass") {
//         return skyblock.Protect.InterceptEvent(player, block.pos, 'place_block123')
//     }

// })


skyblock.Event.listen("onDestroyBlock", (player, block) => {

    return skyblock.Protect.InterceptEvent(player, block.pos, 'destroy_block');

})

skyblock.Event.listen("onPlaceBlock", (player, block) => {

    return skyblock.Protect.InterceptEvent(player, block.pos, "place_block")

})



const friendly_mob = ["minecraft: ocelot", "minecraft: cat", "minecraft: polar_bear", "minecraft: wolf",
    "minecraft: sheep", "minecraft: pig", "minecraft: cow", "minecraft: bee", "minecraft: chicken",
    "minecraft: mooshroom", "minecraft: parrot", "minecraft: rabbit", "minecraft: llama", "minecraft: horse",
    "minecraft: donkey", "minecraft: mule", "minecraft: tropicalfish",
    "minecraft: cod", "minecraft: pufferfish", "minecraft: salmon", "minecraft: dolphin", "minecraft: turtle",
    "minecraft: panda", "minecraft: fox", "minecraft: squid", "minecraft: glow_squid", "minecraft: trader_llama",
    "minecraft: tadpole", "minecraft: frog", "minecraft: allay", "minecraft: axolotl", "minecraft: goat",
    "minecraft:wandering_trader", "minecraft:villager_v2"]

skyblock.Event.listen("onAttackEntity", (player, entity) => {

    if (entity.isPlayer()) {

        return skyblock.Protect.InterceptEvent(player, entity.pos, 'atk_player')

    } else {

        if (friendly_mob.includes(entity.type)) {

            return skyblock.Protect.InterceptEvent(player, entity.pos, 'atk_friendly_mob')

        }
        else {

            return skyblock.Protect.InterceptEvent(player, entity.pos, 'atk_hostile_mob')
        }
    }

})



skyblock.Event.listen("onUseItem", (player, item) => {

    switch (item.type) {
        case "minecraft:bow":
            return skyblock.Protect.InterceptEvent(player, player.pos, 'allow_use_projectile');
        case "minecraft:crossbow":
            return skyblock.Protect.InterceptEvent(player, player.pos, 'allow_use_projectile');
        case "minecraft:trident":
            return skyblock.Protect.InterceptEvent(player, player.pos, 'allow_use_projectile');
        case "minecraft:bucket":
            return skyblock.Protect.InterceptEvent(player, player.pos, 'allow_use_bucket');
        default:
            return true;
    }


})



skyblock.Event.listen("onTakeItem", (player) => {

    return skyblock.Protect.InterceptEvent(player, player.pos, 'take_item');

})

skyblock.Event.listen("onDropItem", (player) => {

    return skyblock.Protect.InterceptEvent(player, player.pos, 'drop_item');

})


let shulker_box = ["minecraft:shulker_box", "minecraft:undyed_shulker_box",
    "minecraft:white_shulker_box", "minecraft:light_gray_shulker_box",
    "minecraft:gray_shulker_box", "minecraft:black_shulker_box", "minecraft:brown_shulker_box",
    "minecraft:red_shulker_box", "minecraft:orange_shulker_box", "minecraft:yellow_shulker_box",
    "minecraft:lime_shulker_box", "minecraft:green_shulker_box", "minecraft:cyan_shulker_box",
    "minecraft:light_blue_shulker_box", "minecraft:blue_shulker_box", "minecraft:purple_shulker_box",
    "minecraft:magenta_shulker_box", "minecraft:pink_shulker_box"]

skyblock.Event.listen("onOpenContainer", (player, block) => {

    if (shulker_box.includes(block.type)) return skyblock.Protect.InterceptEvent(player, block.pos, "allow_open_dispenser")

    switch (block.type) {
        case "minecraft:crafting_table":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_ues_crafting_table")
        case "minecraft:furnace":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_ues_furnace")
        case "minecraft:blast_furnace":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_ues_blast_furnace")
        case "minecraft:smoker":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_ues_smoker")
        case "minecraft:brewing_stand":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_ues_brewing_stand")
        case "minecraft:enchanting_table":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_ues_enchanting_table")
        case "minecraft:shulker_box":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_open_dispenser")
        case "minecraft:undyed_shulker_box":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_open_dispenser")
        case "minecraft:beacon":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_ues_beacon")
        case "minecraft:anvil":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_open_anvil")
        case "minecraft:barrel":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_open_barrel")
        case "minecraft:hopper":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_open_hopper")
        case "minecraft:chest":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_open_chest")
        case "minecraft:dropper":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_open_dropper")
        case "minecraft:dispenser":
            return skyblock.Protect.InterceptEvent(player, block.pos, "allow_open_dispenser")
        default:
            return true;
    }

})




function debounce(func, delay) {

    let timeoutId = null;

    return function (...args) {

        if (timeoutId) {
            clearInterval(timeoutId);
        }

        timeoutId = setTimeout(() => {

            func.apply(this, args);

        }, delay);

    };
}

const debouncedonUseBucketTake = debounce((player, item, target) => {

    if (player.isSneaking) {

        if (target.type == "minecraft:obsidian" && player.islandID == player.inIsland) {

            mc.setBlock(target.pos, "minecraft:lava", 0)

            player.sendMsg("已将黑曜石转化为岩浆~")


        }

    }

}, 200);


mc.listen("onUseBucketTake", (player, item, target) => {


    debouncedonUseBucketTake(player, item, target)


})


// 装饰器示例

// function onDestroyBlock(player, block) {

//     return skyblock.Protect.InterceptEvent(player, block.pos, 'destroy_block')

// }

// function onDestroyBlockBefore(player, block) {

//     if (block.type == "minecraft:glass") {

//         return !skyblock.Protect.InterceptEvent(player, block.pos, 'destroy_block233')

//     }

// }

// const onDestroyBlockHandler = onDestroyBlock.before(onDestroyBlockBefore);

// mc.listen("onDestroyBlock", (player, block) => {

//     return onDestroyBlockHandler(player, block)

// })



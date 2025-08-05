

class IslandMenu {

    static Form(player) {

        let fm = mc.newSimpleForm().setTitle("岛屿菜单");

        fm.addButton("返回岛屿", "textures/ui/icon_recipe_nature");

        fm.addButton("岛屿传送点", "textures/ui/sidebar_icons/realms");

        fm.addButton("岛屿挑战", "textures/ui/sidebar_icons/genre");

        fm.addButton("岛屿设置", "textures/ui/icon_setting");

        player.sendForm(fm, (player, id) => {

            if (id == null) return;

            switch (id) {
                case 0:
                    player.runcmd("is spawn");
                    break;
                case 1:
                    this.islandWarp(player);
                    break;
                case 2:
                    player.runcmd("challenges");
                    break;
                case 3:
                    this.islandSet(player);
                    break;
                default:
                    break;
            }

        })

    }


    static islandWarp(player) {

        let fm = mc.newSimpleForm().setTitle("空岛菜单")

        fm.addButton("我的岛屿传送点");

        fm.addButton("公开岛屿列表");

        fm.addButton("创建传送点");

        fm.addButton("传送点设置");

        fm.addButton("§l返回上一级");

        player.sendForm(fm, (player, id) => {

            if (id == null) return false

            switch (id) {
                case 0:
                    player.runcmd("is warp get")
                    break;
                case 1:
                    player.runcmd("is warp list")
                    break;
                case 2:
                    player.runcmd("is warp create")
                    break;
                case 3:
                    this.islandWarpSet(player);
                    break;
                case 4:
                    this.Form(player)
                    break;
                default:
                    break;
            }

        })

    }


    static islandWarpSet(player) {

        let fm = mc.newSimpleForm().setTitle("空岛菜单")

        fm.addButton("是否公开传送点");

        fm.addButton("删除传送点");

        fm.addButton("设置岛屿出生点");

        fm.addButton("§l返回上一级");

        player.sendForm(fm, (player, id) => {

            if (id == null) return false

            switch (id) {
                case 0:
                    player.runcmd("is warp set")
                    break;
                case 1:
                    player.runcmd("is warp delete")
                    break;
                case 2:
                    player.runcmd("is set spawn")
                    break;
                case 3:
                    this.islandWarp(player);
                    break;
                default:
                    break;
            }

        })


    }

    static islandSet(player) {

        let fm = mc.newSimpleForm().setTitle("空岛菜单")

        fm.addButton("设置岛屿权限");

        fm.addButton("查询岛屿等级");

        fm.addButton("删除岛屿");

        fm.addButton("§l返回上一级");

        player.sendForm(fm, (player, id) => {

            if (id == null) return false

            switch (id) {
                case 0:
                    player.runcmd("is set perms")
                    break;
                case 1:
                    player.runcmd("is level get")
                    break;
                case 2:
                    player.runcmd("is delete")
                    break;
                case 3:
                    this.Form(player);
                    break;
                default:
                    break;
            }

        })


    }

}



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

const debouncedonUseItem = debounce((player, item) => {

    if (item?.type == "minecraft:clock") player.runcmd("is")

}, 200);



mc.listen("onUseItem", (player, item) => {

    debouncedonUseItem(player, item)

})

mc.listen("onAttackBlock", (player, block, item) => {

    if (item?.type == "minecraft:clock") player.runcmd("is")

})


skyblock.Event.listen("onExecuteSkyCommandIs", (context) => IslandMenu.Form(context._ori.player))



// 进服给钟

mc.listen("onJoin", (player) => {

    const hasClock = player.getInventory().getAllItems().some(item => item.type === "minecraft:clock");

    if (!hasClock) {

        const clock = mc.newItem(NBT.parseSNBT(`{"Count":1b,"Damage":0s,"Name":"minecraft:clock","WasPickedUp":0b,"tag":{"minecraft:item_lock":2b,"minecraft:keep_on_death":1b}}`));

        player.giveItem(clock);

    }

})

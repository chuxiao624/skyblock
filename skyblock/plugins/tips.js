


function SetIslandWelcome(player) {



}






skyblock.Event.listen("onEnterIsland", (player, id) => {

    let str = player.islandID == id ? "§a欢迎回来" : "§a你正在访问"

    player.setTitle(str, 2)

    player.setTitle(`§c${skyblock.Locator.data[id].name}`, 3)

})


skyblock.Event.listen("onInisland", (player, id) => {

    let str = player.islandID == id ? `` : `你正在${skyblock.Locator.data[id].name}的岛屿`

    player.tell(str, 4)

})



skyblock.Event.listen("onLeaveIsland", (player, id) => {

    player.tell(`你离开了 ${skyblock.Locator.data[id].name} 的岛屿`, 4)

})

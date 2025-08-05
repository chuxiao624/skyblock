

let old_file = new JsonConfigFile('.\\plugins\\skyblock\\plugins\\convert\\data.json', '{}');



function convert() {

    let old_data = old_file.get("LAND_DATA");

    let length = Object.keys(old_data).length;

    Object.keys(old_data).forEach((dt) => {

        let old = old_data[dt];

        skyblock.Locator.convertIslandData(old.name, dt, [old.range.first, old.range.last], old.range.height)

    })


    skyblock.Locator.convertPos(length * 3);

}


mc.listen("onServerStarted", () => {

    const cmd = mc.newCommand("convertsky", "空岛数据转换", PermType.Console)

    cmd.overload([])

    cmd.setCallback((_cmd, _ori, out, res) => {

        convert();

        log("空岛数据转换完成");

    })

    cmd.setup();

})

import { config } from "plugins/skyblock/lib/modules/__config.js"

class IslandProtect {

    constructor() {

        this.open_the_end = config.get("base").open_the_end

        this.open_the_nether = config.get("base").open_the_nether

    }

    DotProduct(A, B, P) {
        let S = [Math.floor(A[0]), Math.floor(B[0])].sort((a, b) => a - b);
        let E = [Math.floor(A[1]), Math.floor(B[1])].sort((a, b) => a - b);
        return (
            Math.floor(P.x) >= S[0] &&
            Math.floor(P.x) <= S[1] &&
            Math.floor(P.z) >= E[0] &&
            Math.floor(P.z) <= E[1] &&
            P.dimid == 0
        );
    }

    ReturnID(data, key, target) {

        let id = null

        Object.keys(data).some(value => {

            let pos = data[value][key]

            if (this.DotProduct(pos[0], pos[1], target)) id = value

        })

        return id
    }


    InterceptEventHandler(player, target, subject) {

        if (player.isOP()) return true

        // 维度限制
        if (player.pos.dimid == 2 && this.open_the_end) return true

        if (player.pos.dimid == 1 && this.open_the_nether) return true


        let id = this.ReturnID(skyblock.Locator.data, "range", target);

        // 是否不为岛屿
        if (id == null) return skyblock.config.get("worldPermission")[subject]

        // 是否为自己的岛屿
        if (player.islandID == id) return true

        // 检查岛屿权限
        return skyblock.Perms.checkPermission(player.xuid, id, subject);

    }


    InterceptIslandEvent(target, subject) {

        let id = this.ReturnID(skyblock.Locator.data, "range", target);

        if (id == null) return skyblock.config.get("worldEvent")[subject]

        return skyblock.Perms.checkEvent(id, subject);
    }


    InterceptEvent(player, target, subject) {

        const result = this.InterceptEventHandler(player, target, subject)

        result ? true : player.tell(skyblock.__i18n.tr("protection.error"), 4)

        return result;

    }

}


const Protect = new IslandProtect();


export { Protect }



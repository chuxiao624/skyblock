

import { WarpData } from "plugins/skyblock/src/modules/warp/repo.js";
import { island } from "plugins/skyblock/src/api/island.js";
import { i18n } from "plugins/skyblock/src/core/I18n.js";

/** 编辑木牌名称的表单 */
export function openEditSignGui(player, block, be, nbt, frontText) {
    if (!player.isOnOwnIsland) {
        player.sendMsg(i18n.tr("warp.not_on_own_island"));
        return;
    }

    const lines = frontText.split("\n");
    const oldName = lines[1]?.trim();

    const form = mc.newCustomForm();
    form.setTitle(i18n.tr("warp.edit_sign_title"));
    form.addInput(i18n.tr("warp.edit_sign_name"), oldName, oldName);

    player.sendForm(form, (p, dataArr) => {
        if (!dataArr) return;
        const newName = dataArr[0]?.trim();
        if (!newName || newName === oldName) return;

        if (!WarpData.isValidName(newName)) {
            return p.sendMsg(i18n.tr("warp.invalid_name"));
        }
        if (WarpData.get(p.islandId, newName)) {
            return p.sendMsg(i18n.tr("warp.already_exists"));
        }

        if (!WarpData.rename(p.islandId, oldName, newName)) {
            return p.sendMsg(i18n.tr("warp.rename_fail"));
        }

        // 更新木牌
        const newText = frontText.replace(oldName, newName);
        nbt.getTag("FrontText").setString("Text", newText);
        be.setNbt(nbt);
        p.refreshChunks();

        p.sendMsg(i18n.tr("warp.rename_success", { from: oldName, to: newName }));
    });
}

/** 自家岛屿 点击列表中的 warp 进行传送 */
export function openListGui(player) {
    const warps = Object.entries(WarpData.list(player.islandId));
    if (warps.length === 0) return player.sendMsg(i18n.tr("warp.no_warps"));

    const form = mc.newSimpleForm().setTitle(i18n.tr("warp.home_title"));
    warps.forEach(([name, w]) => {
        form.addButton(`${name}\n${w.public ? "§a公开" : "§7私有"}`);
    });

    player.sendForm(form, (p, idx) => {
        if (idx == null) return;
        p.teleport(...WarpData.keyToPos(warps[idx][1].sign_pos));
    });
}

/** 公开列表  先选岛屿再选 warp */
export function openPublicGui(player) {
    const all = WarpData.readAll();
    const islands = Object.keys(all)
        .map(islandId => ({
            islandId,
            name: island.getIslandName(islandId),
            publicWarps: Object.entries(WarpData.listPublic(islandId)),
        }))
        .filter(({ publicWarps, name }) => publicWarps.length > 0 && name);

    if (islands.length === 0) return player.sendMsg(i18n.tr("warp.no_public_warps"));

    const form = mc.newSimpleForm().setTitle(i18n.tr("warp.list_title"));
    islands.forEach(({ name, publicWarps }) => {
        form.addButton(`${name}\n§7${publicWarps.length} 个传送点`);
    });

    player.sendForm(form, (p, idx) => {
        if (idx == null) return;
        openIslandWarpsGui(p, islands[idx]);
    });
}

function openIslandWarpsGui(player, { name, publicWarps }) {
    const form = mc.newSimpleForm().setTitle(name);
    publicWarps.forEach(([n]) => form.addButton(n));

    player.sendForm(form, (p, idx) => {
        if (idx == null) return;
        p.teleport(...WarpData.keyToPos(publicWarps[idx][1].sign_pos));
    });
}

/** 切换公开/私有 */
export function openToggleGui(player) {
    const warps = Object.entries(WarpData.list(player.islandId));
    if (warps.length === 0) return player.sendMsg(i18n.tr("warp.no_warps"));

    const form = mc.newSimpleForm().setTitle(i18n.tr("warp.edit_title"));

    warps.forEach(([n, w]) => form.addButton(`${n}\n${w.public ? "§a公开" : "§7私有"}`));

    player.sendForm(form, (p, idx) => {
        if (idx == null) return;
        const [name] = warps[idx];
        const nowPublic = WarpData.togglePublic(p.islandId, name);
        p.sendMsg(i18n.tr("warp.toggle_success", {
            name,
            state: nowPublic ? "公开" : "私有",
        }));
    });
}

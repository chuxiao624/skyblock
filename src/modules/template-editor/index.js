
import { i18n } from "plugins/skyblock/src/core/I18n.js";
import { L } from "plugins/skyblock/src/core/Logger.js";
import { Timer } from "plugins/skyblock/src/core/Timer.js";
import { config } from "plugins/skyblock/src/core/Config.js";
import { CONST } from "plugins/skyblock/src/core/constants.js";
import { PATHS } from "plugins/skyblock/src/core/paths.js";

const log = L("Cmd:tpl");

// 边框粒子 
const PARTICLE_BORDER = "minecraft:villager_happy";
// 爱心粒子
const PARTICLE_SPAWN = "minecraft:heart_particle";

const PARTICLE_INTERVAL_MS = 1000;
const ATTACK_THROTTLE_MS = 200;

// xuid ->  [x,y,z]
const sessions = new Map();
// 节流
const lastInteract = new Map();


// 坐标格式化
function getBounds(pos1, pos2) {
    const min = [Math.min(pos1[0], pos2[0]), Math.min(pos1[1], pos2[1]), Math.min(pos1[2], pos2[2])];
    const max = [Math.max(pos1[0], pos2[0]), Math.max(pos1[1], pos2[1]), Math.max(pos1[2], pos2[2])];
    const size = [max[0] - min[0] + 1, max[1] - min[1] + 1, max[2] - min[2] + 1];
    return { min, max, size };
}

// 计算偏移值
function calcPasteOffset(min, size, spawn) {
    return [
        Math.floor(size[0] / 2) - (spawn[0] - min[0]),
        spawn[1] - min[1],
        Math.floor(size[2] / 2) - (spawn[2] - min[2]),
    ];
}

function requireFullSession(player) {
    const sess = sessions.get(player.xuid);
    if (!sess) { player.sendMsg(i18n.tr("tpl.no_session")); return null; }
    if (!sess.pos1 || !sess.pos2) { player.sendMsg(i18n.tr("tpl.missing_pos")); return null; }
    if (!sess.spawn) { player.sendMsg(i18n.tr("tpl.missing_spawn")); return null; }
    return sess;
}

// 数据
function buildTemplateMeta(file, size, spawnY, pasteOffset) {
    return { file, spawnX: size[0], spawnY, spawnZ: size[2], pasteOffset };
}

function ensureAdmin(player) {
    if (!player.isAdmin) { player.sendMsg(i18n.tr("admin.no_permission")); return false; }
    return true;
}

function clearSession(xuid) {
    Timer.stop(`tpl:${xuid}`);
    sessions.delete(xuid);
    lastInteract.delete(xuid);
}

function shouldThrottle(xuid) {
    const now = Date.now();
    if (now - (lastInteract.get(xuid) || 0) < ATTACK_THROTTLE_MS) return true;
    lastInteract.set(xuid, now);
    return false;
}

/** pos1+pos2 都齐了才启动粒子,否则停掉。Timer.start 自带覆盖语义。 */
function refreshParticles(xuid) {
    const sess = sessions.get(xuid);
    if (!sess?.pos1 || !sess?.pos2) { Timer.stop(`tpl:${xuid}`); return; }
    Timer.start(`tpl:${xuid}`, () => drawBorder(sess), PARTICLE_INTERVAL_MS);
}

// 绘制边框粒子
function drawBorder(sess) {
    const { pos1, pos2, spawn } = sess;
    if (!pos1 || !pos2) return;
    const { min, max } = getBounds(pos1, pos2);
    const draw = (x, y, z) => mc.runcmdEx(`particle ${PARTICLE_BORDER} ${x} ${y} ${z}`);

    for (let x = min[0]; x <= max[0]; x++) {
        draw(x, min[1], min[2]); draw(x, min[1], max[2]);
        draw(x, max[1], min[2]); draw(x, max[1], max[2]);
    }
    for (let y = min[1]; y <= max[1]; y++) {
        draw(min[0], y, min[2]); draw(min[0], y, max[2]);
        draw(max[0], y, min[2]); draw(max[0], y, max[2]);
    }
    for (let z = min[2]; z <= max[2]; z++) {
        draw(min[0], min[1], z); draw(min[0], max[1], z);
        draw(max[0], min[1], z); draw(max[0], max[1], z);
    }
    if (spawn) mc.runcmdEx(`particle ${PARTICLE_SPAWN} ${spawn[0]} ${spawn[1]} ${spawn[2]}`);
}

// 写入到 .mcstructure 文件
function writeStructure(player, sess, fileName, onSuccess) {
    const { min, max } = getBounds(sess.pos1, sess.pos2);
    const A = new IntPos(...min, sess.dim);
    const B = new IntPos(...max, sess.dim);
    const nbt = mc.getStructure(A, B, false, true).toBinaryNBT();

    const targetPath = `./${PATHS.TEMPLATES_DIR}/${fileName}.mcstructure`;
    const file = new File(targetPath, File.WriteMode, true);
    file.write(nbt, (ok) => {
        file.close();
        if (!ok) return player.sendMsg(i18n.tr("tpl.save_write_fail"));
        try { File.copy(targetPath, "./" + PATHS.BDS_STRUCTURES); }
        catch (e) { log.warn("热同步到 BDS structures 失败:", e); }
        onSuccess();
    });
}


function handleStart(player) {
    if (sessions.has(player.xuid)) return player.sendMsg(i18n.tr("tpl.already_in_session"));
    sessions.set(player.xuid, { pos1: null, pos2: null, spawn: null, dim: player.pos.dimid });
    player.sendMsg(i18n.tr("tpl.session_started"));
}

function handleCancel(player) {
    if (!sessions.has(player.xuid)) return player.sendMsg(i18n.tr("tpl.no_session"));
    clearSession(player.xuid);
    player.sendMsg(i18n.tr("tpl.session_cancelled"));
}

function handleSetSpawn(player) {
    const sess = sessions.get(player.xuid);
    if (!sess) return player.sendMsg(i18n.tr("tpl.no_session"));
    if (sess.dim !== player.pos.dimid) return player.sendMsg(i18n.tr("tpl.dim_mismatch"));
    sess.spawn = [Math.floor(player.pos.x), Math.floor(player.pos.y), Math.floor(player.pos.z)];
    player.sendMsg(i18n.tr("tpl.spawn_set", { x: sess.spawn[0], y: sess.spawn[1], z: sess.spawn[2] }));
    refreshParticles(player.xuid);
}


function handleSave(player) {
    const sess = requireFullSession(player);
    if (!sess) return;
    const { size } = getBounds(sess.pos1, sess.pos2);

    const form = mc.newCustomForm()
        .setTitle(i18n.tr("tpl.save_title"))
        .addLabel(i18n.tr("tpl.save_size_info", { x: size[0], y: size[1], z: size[2] }))
        .addInput(i18n.tr("tpl.save_name"), "")
        .addInput(i18n.tr("tpl.save_file"), "")
        .addInput(i18n.tr("tpl.save_desc"), "")
        .addInput(i18n.tr("tpl.save_spawn_y"), "", "63");

    player.sendForm(form, (p, res) => {
        if (res == null) return;
        const name = (res[1] || "").trim();
        const fileName = (res[2] || "").trim().toLowerCase().replace(/\s+/g, "_");
        const desc = (res[3] || "").trim();
        const spawnY = parseInt(res[4]);

        if (!name) return p.sendMsg(i18n.tr("tpl.save_no_name"));
        if (!fileName || !/^[a-z0-9_-]+$/.test(fileName)) return p.sendMsg(i18n.tr("tpl.save_bad_file"));
        if (!Number.isFinite(spawnY)) return p.sendMsg(i18n.tr("tpl.save_bad_y"));

        const templates = config.get("templates") || [];
        if (templates.find(t => t.file === fileName)) return p.sendMsg(i18n.tr("tpl.save_file_exists", { file: fileName }));

        writeStructure(p, sess, fileName, () => {
            const { min, size } = getBounds(sess.pos1, sess.pos2);
            const pasteOffset = calcPasteOffset(min, size, sess.spawn);
            const entry = { name, description: desc, ...buildTemplateMeta(fileName, size, spawnY, pasteOffset) };
            config.set("templates", [...templates, entry]);
            log.info(`{g}模板保存: {y}${name}/${fileName}{g} size={y}${size.join("x")}{g} offset={y}[${pasteOffset.join(",")}]`);
            p.sendMsg(i18n.tr("tpl.save_done", { name, file: fileName }));
            clearSession(p.xuid);
        });
    });
}



function handleSaveNether(player, mainFile) {
    if (!mainFile) return player.sendMsg(i18n.tr("tpl.savenether.usage"));
    const sess = requireFullSession(player);
    if (!sess) return;

    const templates = config.get("templates") || [];
    const mainIdx = templates.findIndex(t => t.file === mainFile);
    if (mainIdx === -1) return player.sendMsg(i18n.tr("tpl.savenether.no_main", { file: mainFile }));

    if (templates[mainIdx].nether_template) {
        return player.sendModalForm(i18n.tr("tpl.savenether.already_set"),
            i18n.tr("tpl.savenether.confirm_overwrite_body", { main: mainFile }),
            i18n.tr("common.confirm"),
            i18n.tr("common.cancel"),
            (p, ok) => { if (ok) promptSaveNetherForm(p, mainFile, mainIdx); });
    }
    promptSaveNetherForm(player, mainFile, mainIdx);
}

function promptSaveNetherForm(player, mainFile, mainIdx) {
    const sess = requireFullSession(player);
    if (!sess) return;
    const { size } = getBounds(sess.pos1, sess.pos2);
    const fileName = `${mainFile}_nether`;

    const form = mc.newCustomForm()
        .setTitle(i18n.tr("tpl.savenether.title"))
        .addLabel(i18n.tr("tpl.savenether.info", {
            main: mainFile, x: size[0], y: size[1], z: size[2], file: fileName,
        }))
        .addInput(i18n.tr("tpl.savenether.spawn_y_label"), "", "33");

    player.sendForm(form, (p, res) => {
        if (res == null) return;
        const spawnY = parseInt(res[1]);
        if (!Number.isFinite(spawnY)) return p.sendMsg(i18n.tr("tpl.save_bad_y"));

        writeStructure(p, sess, fileName, () => {
            const { min, size } = getBounds(sess.pos1, sess.pos2);
            const pasteOffset = calcPasteOffset(min, size, sess.spawn);
            // 重新读 templates 再 patch,避免拿到旧引用
            const cur = (config.get("templates") || []).map(t => ({ ...t }));
            if (!cur[mainIdx]) return p.sendMsg(i18n.tr("tpl.savenether.no_main", { file: mainFile }));
            cur[mainIdx].nether_template = buildTemplateMeta(fileName, size, spawnY, pasteOffset);
            config.set("templates", cur);
            log.info(`{g}下界模板保存: {y}${fileName} {g}关联到 {y}${mainFile}{g} offset={y}[${pasteOffset.join(",")}]`);
            p.sendMsg(i18n.tr("tpl.savenether.done", { main: mainFile, file: fileName }));
            clearSession(p.xuid);
        });
    });
}


// 把单个角点格式化成「x, y, z」,没设的回「未设」
function fmtPos(p) {
    return p ? `${p[0]}, ${p[1]}, ${p[2]}` : i18n.tr("tpl.menu.unset");
}

// 主菜单:根据是否有会话切两套按钮
function openMainGui(player) {
    const sess = sessions.get(player.xuid);
    const form = mc.newSimpleForm().setTitle(i18n.tr("tpl.menu.title"));

    // 无会话 只能开始编辑
    if (!sess) {
        form.setContent(i18n.tr("tpl.menu.idle_body"));
        form.addButton(i18n.tr("tpl.menu.btn.start"));
        player.sendForm(form, (p, id) => {
            if (id === 0) handleStart(p);
        });
        return;
    }

    // 已在会话 展示当前进度,给出后续操作
    form.setContent(i18n.tr("tpl.menu.session_body", {
        pos1: fmtPos(sess.pos1),
        pos2: fmtPos(sess.pos2),
        spawn: fmtPos(sess.spawn),
    }));
    form.addButton(i18n.tr("tpl.menu.btn.spawn"));        // 0 设出生点
    form.addButton(i18n.tr("tpl.menu.btn.save"));         // 1 保存主模板
    form.addButton(i18n.tr("tpl.menu.btn.save_nether"));  // 2 保存下界模板
    form.addButton(i18n.tr("tpl.menu.btn.cancel"));       // 3 取消编辑

    player.sendForm(form, (p, id) => {
        if (id == null) return;
        switch (id) {
            case 0: return handleSetSpawn(p);
            case 1: return handleSave(p);
            case 2: return openSaveNetherPicker(p);
            case 3: return confirmCancel(p);
        }
    });
}

// 取消会话二次确认
function confirmCancel(player) {

    return player.sendModalForm(i18n.tr("tpl.menu.cancel_confirm_title"),
        i18n.tr("tpl.menu.cancel_confirm_body"),
        i18n.tr("common.confirm"),
        i18n.tr("common.cancel"),
        (p, ok) => { if (ok) handleCancel(p); });

}

// 下界保存
function openSaveNetherPicker(player) {
    const sess = requireFullSession(player);
    if (!sess) return;

    const templates = config.get("templates") || [];
    if (templates.length === 0) return player.sendMsg(i18n.tr("tpl.savenether.pick_main_empty"));

    const form = mc.newCustomForm()
        .setTitle(i18n.tr("tpl.savenether.pick_main_title"))
        .addDropdown(
            i18n.tr("tpl.savenether.pick_main_label"),
            templates.map(t => `${t.name} (${t.file})`),
            0,
        );

    player.sendForm(form, (p, res) => {
        if (res == null) return;
        const main = templates[res[0]];
        if (!main) return;
        handleSaveNether(p, main.file);
    });
}


/** 木斧设角点的统一处理(左键 pos1 / 右键 pos2 共用) */
function handleAxe(player, item, block, point) {
    if (!sessions.has(player.xuid)) return;
    if (item?.type !== "minecraft:wooden_axe") return;
    if (shouldThrottle(player.xuid)) return false;
    const sess = sessions.get(player.xuid);
    const pos = block.pos;
    if (sess.dim !== pos.dimid) { player.sendMsg(i18n.tr("tpl.dim_mismatch")); return false; }
    sess[point] = [pos.x, pos.y, pos.z];
    player.sendMsg(i18n.tr(`tpl.${point}_set`, { x: pos.x, y: pos.y, z: pos.z }));
    refreshParticles(player.xuid);
    return false;
}

// mc.listen("onAttackBlock", (player, block, item) => handleAxe(player, item, block, "pos1"));
mc.listen("onUseItemOn", (player, item, block) => handleAxe(player, item, block, "pos2"));

mc.listen("onDestroyBlock", (player, block) => {

    if (sessions.has(player.xuid) && player.getHand?.()?.type == "minecraft:wooden_axe") {
        handleAxe(player, player.getHand(), block, "pos1")
        return false;
    }

});

mc.listen("onLeft", (player) => clearSession(player.xuid));


export function setupTemplateEditorCommand() {
    const cmd = mc.newCommand("tpl", i18n.tr("tpl.template.editor"), PermType.Any);
    cmd.overload([]);
    cmd.setCallback((_cmd, origin, output, _results) => {
        const player = origin.player;
        if (!player) { output.error("/tpl 必须由玩家执行"); return; }
        if (!ensureAdmin(player)) return;
        openMainGui(player);
    });
    cmd.setup();
}

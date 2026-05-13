/**
 * 空间网格索引
 *
 * 把世界 X/Z 平面按 cellSize 切成网格
 * 每个岛屿登记到它覆盖的所有格子
 * 查询坐标时,只看该格子里的候选岛(通常 0-1 个)
 *
 */

export class SpatialGrid {
    /**
     * @param {number} cellSize 网格大小
     */
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();      // "cx,cz" -> Set<islandId>
        this.idIndex = new Map();   // islandId -> [[cx,cz], ...]
    }

    _key(cx, cz) { return cx + "," + cz; }

    _coverCells(min, max) {
        const cells = [];
        const x0 = Math.floor(min[0] / this.cellSize);
        const x1 = Math.floor(max[0] / this.cellSize);
        const z0 = Math.floor(min[1] / this.cellSize);
        const z1 = Math.floor(max[1] / this.cellSize);
        for (let x = x0; x <= x1; x++)
            for (let z = z0; z <= z1; z++)
                cells.push([x, z]);
        return cells;
    }

    /**
     * 添加一个岛屿
     * @param {string} islandId
     * @param {{min:[x,z], max:[x,z]}} range
     */
    add(islandId, range) {
        if (this.idIndex.has(islandId)) this.remove(islandId);
        const cells = this._coverCells(range.min, range.max);
        for (const [cx, cz] of cells) {
            const k = this._key(cx, cz);
            let set = this.grid.get(k);

            if (!set) { set = new Set(); this.grid.set(k, set); }

            set.add(islandId);
        }
        this.idIndex.set(islandId, cells);
    }

    remove(islandId) {
        const cells = this.idIndex.get(islandId);
        if (!cells) return;
        for (const [cx, cz] of cells) {
            const k = this._key(cx, cz);
            const set = this.grid.get(k);
            if (!set) continue;
            set.delete(islandId);
            if (set.size === 0) this.grid.delete(k);
        }
        this.idIndex.delete(islandId);
    }

    /**
     * 查询某点所在格子的候选岛屿集合
     * @param {{x:number, z:number}} pos
     * @returns {Set<string>}
     */
    query(pos) {
        const cx = Math.floor(pos.x / this.cellSize);
        const cz = Math.floor(pos.z / this.cellSize);
        return this.grid.get(this._key(cx, cz)) ?? new Set();
    }

    /** 清空 */
    clear() {
        this.grid.clear();
        this.idIndex.clear();
    }
}

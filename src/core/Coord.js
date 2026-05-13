/**
 * 螺旋坐标分配
 *
 * 算法:从 (startX, startZ) 出发,按 右 → 下 → 左 → 上 顺时针螺旋
 * 每两次转向 totalMoves +1,从而形成螺旋扩张
 *
 * 腐竹必须在创建第一个岛之前配置好 startX/startZ/range/gap,创建后修改会导致混乱且不生效
 * 
 */

import { Storage } from "plugins/skyblock/src/core/Storage.js";
import { PATHS } from "plugins/skyblock/src/core/paths.js";
import { config } from "plugins/skyblock/src/core/Config.js";

const DIRECTIONS = ["right", "down", "left", "up"];
const STEPS = {
    right: { dx: 1, dz: 0 },
    down: { dx: 0, dz: 1 },
    left: { dx: -1, dz: 0 },
    up: { dx: 0, dz: -1 },
};

class Coordinate {
    constructor() {
        this._storage = new Storage(PATHS.COORD, "{}");

        const island = config.get("island");
        this.startX = island.startX;
        this.startZ = island.startZ;
        this.range = island.range;
        this.distance = island.range + island.gap;

        this.state = this._storage.init("data", {
            offsetX: 0, offsetZ: 0,
            direction: "right",
            moves: 0,
            totalMoves: 1,
            loops: 0,
            steps: 0,
            isInit: false,
        });
    }

    /**
     * 取下一个岛屿坐标
     * @returns {{ center:{x,z}, min:[x,z], max:[x,z] }}
     */
    next() {
        let { offsetX, offsetZ, direction, moves, totalMoves, loops, steps, isInit } = this.state;

        // 第一次:返回起点,不走螺旋
        if (!isInit) {
            steps++;
            isInit = true;
            this.state = { offsetX, offsetZ, direction, moves, totalMoves, loops, steps, isInit };
            this._storage.set("data", this.state);
            return this._build(this.startX, this.startZ);
        }

        // 按当前方向走一格
        const step = STEPS[direction];
        offsetX += step.dx * this.distance;
        offsetZ += step.dz * this.distance;
        moves++;

        // 到达本段终点,转向
        if (moves === totalMoves) {
            loops++;
            moves = 0;
            direction = DIRECTIONS[loops % 4];
            // 每转两次方向,totalMoves +1
            if (loops % 2 === 0) totalMoves++;
        }

        steps++;
        this.state = { offsetX, offsetZ, direction, moves, totalMoves, loops, steps, isInit };
        this._storage.set("data", this.state);

        return this._build(this.startX + offsetX, this.startZ + offsetZ);
    }

    _build(cx, cz) {
        return {
            center: {
                x: Math.floor(cx + this.range / 2),
                z: Math.floor(cz + this.range / 2),
            },
            min: [cx, cz],
            max: [cx + this.range - 1, cz + this.range - 1],
        };
    }
}

export const Coord = new Coordinate();

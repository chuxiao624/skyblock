
/**
     * 岛屿坐标管理
     * @param {Class} Coordinate
 */

import { config } from "plugins/skyblock/lib/modules/__config.js"

class Coordinate {

    constructor() {

        this.File = new JsonConfigFile('.\\plugins\\skyblock\\data\\coord\\coord.json', '{}');

        this.coord = config.get("island")

        this.state = this.File.init("data", {
            x: 0,
            y: 0,
            direction: 'right',
            moves: 0,
            totalMoves: 1,
            loops: 0,
            steps: 0,
            isInit: false
        })


    }

    /**
        * 获取一个新的岛屿坐标
        * @param {void} getNewCoord
        * @return {Array} 返回一个新的岛屿坐标
    */

    getNewCoord() {

        let { x, y, range, distance } = this.coord;

        let { direction, steps, moves, totalMoves, loops, isInit } = this.state;

        if (!isInit) {

            isInit = true;

            steps++;

            this.state = { x, y, direction, steps, moves, totalMoves, loops, isInit };

            this.File.set("data", this.state);

            return [[x, y], [x + range, y + range]];

        }

        switch (direction) {
            case 'right':
                x += distance;
                break;
            case 'down':
                y -= distance;
                break;
            case 'left':
                x -= distance;
                break;
            case 'up':
                y += distance;
                break;
        }

        moves++;

        if (moves === totalMoves) {
            loops++;
            moves = 0;
            switch (loops % 4) {
                case 0:
                    direction = 'right';
                    totalMoves++;
                    break;
                case 1:
                    direction = 'up';
                    break;
                case 2:
                    direction = 'left';
                    totalMoves++;
                    break;
                case 3:
                    direction = 'down';
                    break;
            }
        }

        // 记录步数 , 方便适配

        steps++;

        // save 

        this.coord = { x, y, range, distance };

        this.state = { direction, steps, moves, totalMoves, loops, isInit };

        config.set("island", this.coord);

        this.File.set("data", this.state);

        return [[x, y], [x + range, y + range]];
    }

}

const Coord = new Coordinate();


export { Coord }









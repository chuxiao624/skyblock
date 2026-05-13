/**
 * 定时器管理
 */

class TimerManager {
    constructor() {
        this._intervals = new Map();
        this._timeouts = new Map();
    }

    start(key, fn, interval) {
        this.stop(key);
        const id = setInterval(fn, interval);
        this._intervals.set(key, id);
    }

    stop(key) {
        const id = this._intervals.get(key);
        if (id !== undefined) {
            clearInterval(id);
            this._intervals.delete(key);
        }
    }

    delay(key, fn, ms) {
        this.cancel(key);
        const id = setTimeout(() => {
            this._timeouts.delete(key);
            fn();
        }, ms);
        this._timeouts.set(key, id);
    }

    cancel(key) {
        const id = this._timeouts.get(key);
        if (id !== undefined) {
            clearInterval(id);
            this._timeouts.delete(key);
        }
    }
}

export const Timer = new TimerManager();

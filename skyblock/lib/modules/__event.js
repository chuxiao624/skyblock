/**
     * 事件管理
     * @param {Class} IsLandEventRegistration
 */

class IsLandEventRegistration {

    constructor() {
        this.message = {}
    }
    /**
         * 监听事件
         * @param {String} type 要监听的事件名
         * @param {Array} fn 事件触发的回调函数
     */
    listen(type, fn) {

        if (!this.message[type]) this.message[type] = [];

        this.message[type].push(fn);

    }

    $off(type, fn) {

        if (!this.message[type]) return;

        if (!fn) return this.message[type] = undefined;

        this.message[type] = this.message[type].filter(item => item !== fn);

    }

    /**
         * 注册事件
         * @param {String} type 要注册的事件名
         * @param {Array} agrument 事件参数
         * @return {Boolean} 是否拦截
     */

    $emit(type, agrument) {

        if (!this.message[type]) return true;

        let result = false;

        for (const fn of this.message[type]) {

            if (fn(...agrument) === true) return true;

        }


        return result;

    }

}


/**
     * 前置装饰器
     * @param {String} before 
     * @param {Function} beforeFn 需要挂载的函数
 */
Function.prototype.before = function (beforeFn) {

    let _this = this;

    return function () {

        if (beforeFn.apply(this, arguments) == false) return;

        return _this.apply(this, arguments);
    }

}

/**
     * 后置装饰器
     * @param {String} after
     * @param {Function} afterFn 需要挂载的函数
 */
Function.prototype.after = function (afterFn) {

    let _this = this;

    return function () {

        let result = _this.apply(this, arguments);

        afterFn.apply(this, arguments);

        return result;
    }

}



const Event = new IsLandEventRegistration();


export { Event }
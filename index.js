const FRAME_TIMEOUT = 5 // 最大允许执行5ms
const getTime = () => Date.now()

function requestIdleCallbackProfill(callback, options) {
    setTimeout(() => {
        const origin = getTime()

        const idleDeadline = {
            timeRemaining() {
                const current = getTime()
                const remainingTime = FRAME_TIMEOUT - (current - origin)
                return remainingTime
            }
        }
        callback(idleDeadline)
    })
}

const _ = {
    for (start, condition, loopBody, handle, data, callback) {
        if (start === loopBody(start)) {
            throw new Error('The body of the loop cannot return the same result')
        }
    
        const requestIdleCallback = window.requestIdleCallback || requestIdleCallbackProfill
        return new Promise((resolve) => {
            let init = start
            function idleCallback(idleDeadline) {
                while (true) {
                    if (condition(init)) {
                        const idleTime = idleDeadline.timeRemaining()
                        if (idleTime > 0) {
                            if (data) {
                                const result = handle(data[init], init, data)
                                if (callback) {
                                    const flag = callback(result)
                                    if (flag === false) {
                                        return resolve()
                                    }
                                }
                            } else {
                                handle(init)
                            }
                            init = loopBody(init)
                        } else {
                            return requestIdleCallback(idleCallback)
                        }
                    } else {
                        return resolve()
                    }
                }
            }
            requestIdleCallback(idleCallback)
        })
    },
    async forEach(arr, handle) {
        return _.for(0, i => i < arr.length, i => i + 1, handle, arr)
    },
    async map(arr, handle) {
        const result = []
        await _.for(0, i => i < arr.length, i => i + 1, handle, arr, function (cbResult) {
            result.push(cbResult)
        })
        return result
    },
    async filter(arr, handle) {
        const result = []
        await _.for(0, i => i < arr.length, i => i + 1, handle, arr, function (cbResult) {
            cbResult && result.push(cbResult)
        })
        return result
    },
    async every(arr, handle) {
        let flag = true
        await _.for(0, i => i < arr.length, i => i + 1, handle, arr, function (cbResult) {
            if (!cbResult) {
                flag = false
                return false
            }
        })
        return flag
    },
    async some(arr, handle) {
        let flag = false
        await _.for(0, i => i < arr.length, i => i + 1, handle, arr, function (cbResult) {
            if (cbResult) {
                flag = true
                return false
            }
        })
        return flag
    },
    async reduce(arr, handle, initialValue) {
        const hasInitialValue = initialValue === undefined || initialValue === null
        let [result, start] = hasInitialValue ? [arr[0], 1] : [initialValue, 0]
        await _.for(start, i => i < arr.length, i => i + 1, function (item, index, arr) {
            return handle(result, item, index, arr)
        }, arr, function (cbResult) {
            result = cbResult
        })
        return result
    },
    async reduceRight(arr, handle, initialValue) {
        const hasInitialValue = initialValue === undefined || initialValue === null
        let [result, start] = hasInitialValue ? [arr[arr.length - 1], arr.length - 2] : [initialValue, 0]
        await _.for(start, i => i >= 0, i => i - 1, function (item, index, arr) {
            return handle(result, item, index, arr)
        }, arr, function (cbResult) {
            result = cbResult
        })
        return result
    }
}

export default _
